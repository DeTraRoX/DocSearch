import fs from 'fs';
import path from 'path';
import Document from '../models/Document.js';
import Chunk from '../models/Chunk.js';
import Folder from '../models/Folder.js';
import { extractText, chunkText } from '../services/textExtractor.js';
import * as storageService from '../services/storageService.js';
import * as searchService from '../services/searchService.js';
import { genAI, geminiEnabled } from '../config/gemini.js';

// Helper to map file extensions to enum type
const getFileType = (ext) => {
  const mapping = {
    '.pdf': 'pdf',
    '.docx': 'docx',
    '.txt': 'txt',
    '.png': 'image',
    '.jpg': 'image',
    '.jpeg': 'image',
  };
  return mapping[ext.toLowerCase()] || 'txt';
};

// Async function to generate document summary in the background
const generateDocSummary = async (documentId, text) => {
  if (!geminiEnabled || !genAI) return;
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `Analyze the following document text and write a professional, high-quality summary in 2-3 concise paragraphs. Highlight the key topics and purpose of the document. Do not include any intros or metadata. Output ONLY the summary text:\n\n${text.slice(0, 15000)}`;
    const result = await model.generateContent(prompt);
    const summary = result.response.text().trim();
    await Document.findByIdAndUpdate(documentId, { summary });
    console.log(`Successfully generated summary for document ${documentId}`);
  } catch (error) {
    console.log(`Failed to generate summary for document ${documentId}:`, error.message);
  }
};

// @desc    Upload and index a new document
// @route   POST /api/documents/upload
// @access  Private
export const uploadDocument = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const { title, folder, tags } = req.body;
  const tempPath = req.file.path;
  const originalName = req.file.originalname;
  const fileSize = req.file.size;
  const ext = path.extname(originalName);
  const fileType = getFileType(ext);

  let uploadResult = null;
  try {
    // 1. Extract text and pages
    console.log(`Extracting text from: ${originalName} (type: ${fileType})`);
    const { text, pages } = await extractText(tempPath, fileType);

    // 2. Upload file to permanent storage
    uploadResult = await storageService.uploadFile(req.file);

    // Parse tags if sent as stringified JSON or comma separated
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = JSON.parse(tags);
      } catch {
        parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
      }
    }

    // 3. Create document record
    const document = await Document.create({
      title: title || path.basename(originalName, ext),
      originalName,
      fileUrl: uploadResult.fileUrl,
      storageKey: uploadResult.storageKey,
      fileType,
      fileSize,
      extractedText: text,
      owner: req.user._id,
      folder: folder === 'root' || !folder ? null : folder,
      tags: parsedTags,
    });

    // 4. Chunk text and save chunks in MongoDB for RAG
    const textChunks = chunkText(text, pages);
    const chunkDocs = textChunks.map(chunk => ({
      documentId: document._id,
      owner: req.user._id,
      text: chunk.text,
      pageNumber: chunk.pageNumber,
      chunkIndex: chunk.chunkIndex,
    }));

    let savedChunks = [];
    if (chunkDocs.length > 0) {
      savedChunks = await Chunk.insertMany(chunkDocs);
    }

    // 5. Index in Elasticsearch (runs in background/services if enabled)
    await searchService.indexDocument(document, savedChunks);

    // 6. Generate summary asynchronously in background
    if (text) {
      generateDocSummary(document._id, text).catch(err => console.log('Summary background error:', err.message));
    }

    res.status(201).json({
      message: 'Document uploaded and indexed successfully',
      document: {
        _id: document._id,
        title: document.title,
        fileUrl: document.fileUrl,
        fileType: document.fileType,
        fileSize: document.fileSize,
        tags: document.tags,
        folder: document.folder,
        createdAt: document.createdAt,
      },
    });
  } catch (error) {
    // Delete temp file if anything fails before permanent upload
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    // Delete permanent uploaded file if db record creation failed
    if (uploadResult && uploadResult.storageKey) {
      try {
        await storageService.deleteFile(uploadResult.storageKey, fileType);
      } catch (cleanupError) {
        console.log('Cleanup error details:', cleanupError.message);
      }
    }
    console.log('Upload error details:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all user documents
// @route   GET /api/documents
// @access  Private
export const getDocuments = async (req, res) => {
  try {
    const query = { owner: req.user._id };
    
    if (req.query.folder) {
      query.folder = req.query.folder === 'root' ? null : req.query.folder;
    }
    if (req.query.tag) {
      query.tags = req.query.tag;
    }
    if (req.query.favorite) {
      query.isFavorite = req.query.favorite === 'true';
    }

    const documents = await Document.find(query)
      .select('-extractedText') // Exclude heavy text representation in list query
      .sort({ createdAt: -1 });

    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single document with full details
// @route   GET /api/documents/:id
// @access  Private
export const getDocumentById = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a document
// @route   DELETE /api/documents/:id
// @access  Private
export const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Delete actual file from storage
    await storageService.deleteFile(document.storageKey, document.fileType);

    // Delete chunks from database
    await Chunk.deleteMany({ documentId: document._id });

    // Delete Elasticsearch index
    await searchService.deleteDocumentIndex(document._id);

    // Delete document entry from database
    await document.deleteOne();

    res.json({ message: 'Document removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Download a document
// @route   GET /api/documents/:id/download
// @access  Private
export const downloadDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (document.fileUrl.startsWith('/uploads/')) {
      const filePath = path.resolve(process.env.UPLOAD_DIR || 'uploads', path.basename(document.fileUrl));
      if (fs.existsSync(filePath)) {
        return res.download(filePath, document.originalName);
      } else {
        return res.status(404).json({ message: 'File not found on server disk.' });
      }
    } else {
      // Cloudinary redirect
      return res.redirect(document.fileUrl);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle favorite status
// @route   PUT /api/documents/:id/favorite
// @access  Private
export const toggleFavorite = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    document.isFavorite = !document.isFavorite;
    await document.save();

    res.json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update document folder and tags
// @route   PUT /api/documents/:id/metadata
// @access  Private
export const updateMetadata = async (req, res) => {
  try {
    const { folder, tags } = req.body;
    const document = await Document.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (folder !== undefined) {
      document.folder = folder === 'root' || folder === '' ? null : folder;
    }
    if (tags !== undefined) {
      document.tags = tags;
    }

    await document.save();
    res.json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Folders Management
// @desc    Create a folder
// @route   POST /api/documents/folders
// @access  Private
export const createFolder = async (req, res) => {
  const { name, parentFolder } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Folder name is required' });
  }

  try {
    const folderExists = await Folder.findOne({
      name,
      owner: req.user._id,
      parentFolder: parentFolder || null,
    });

    if (folderExists) {
      return res.status(400).json({ message: 'Folder with this name already exists' });
    }

    const folder = await Folder.create({
      name,
      owner: req.user._id,
      parentFolder: parentFolder || null,
    });

    res.status(201).json(folder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all user folders
// @route   GET /api/documents/folders
// @access  Private
export const getFolders = async (req, res) => {
  try {
    const folders = await Folder.find({ owner: req.user._id }).sort({ name: 1 });
    res.json(folders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete folder (releases files to root)
// @route   DELETE /api/documents/folders/:id
// @access  Private
export const deleteFolder = async (req, res) => {
  try {
    const folderId = req.params.id;
    const folder = await Folder.findOne({ _id: folderId, owner: req.user._id });

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    // Set all documents in this folder to root (null)
    await Document.updateMany({ folder: folderId, owner: req.user._id }, { folder: null });

    // Set child folders to root
    await Folder.updateMany({ parentFolder: folderId, owner: req.user._id }, { parentFolder: null });

    await folder.deleteOne();
    res.json({ message: 'Folder deleted successfully. Contents moved to root.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
