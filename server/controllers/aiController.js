import Chunk from '../models/Chunk.js';
import Document from '../models/Document.js';
import { genAI, geminiEnabled } from '../config/gemini.js';
import { esClient, esEnabled } from '../config/elasticsearch.js';

// Helper to fetch relevant chunks
const getRelevantChunks = async (documentId, queryText, limit = 4) => {
  // If ES enabled, query the chunks index
  if (esEnabled && esClient) {
    try {
      const response = await esClient.search({
        index: 'docsearch_chunks',
        body: {
          size: limit,
          query: {
            bool: {
              must: [
                { term: { documentId: documentId.toString() } },
                {
                  match: {
                    text: queryText
                  }
                }
              ]
            }
          }
        }
      });
      return response.hits.hits.map(hit => ({
        text: hit._source.text,
        pageNumber: hit._source.pageNumber
      }));
    } catch (error) {
      console.log('ES Chunk Query Error:', error.message);
    }
  }

  // MongoDB Fallback
  try {
    const escapedQuery = escapeRegExp(queryText);
    const words = queryText.split(/\s+/).filter(w => w.length > 2);
    let query = { documentId };
    
    if (words.length > 0) {
      const regexConditions = words.map(w => ({ text: new RegExp(escapeRegExp(w), 'i') }));
      query.$or = regexConditions;
    }
    
    let matchingChunks = await Chunk.find(query).limit(limit);
    if (matchingChunks.length === 0) {
      matchingChunks = await Chunk.find({ documentId }).limit(limit);
    }
    
    return matchingChunks.map(c => ({
      text: c.text,
      pageNumber: c.pageNumber
    }));
  } catch (error) {
    console.log('Mongo Chunk Retrieval Fallback Error:', error.message);
    return [];
  }
};

// @desc    Chat with a specific document (RAG)
// @route   POST /api/ai/chat
// @access  Private
export const chatWithDocument = async (req, res) => {
  const { documentId, message } = req.body;

  if (!documentId || !message) {
    return res.status(400).json({ message: 'documentId and message are required' });
  }

  if (!geminiEnabled || !genAI) {
    return res.status(503).json({ message: 'AI services are currently offline (API key missing in .env).' });
  }

  try {
    // 1. Verify document ownership
    const document = await Document.findOne({ _id: documentId, owner: req.user._id });
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // 2. Retrieve relevant chunks
    const chunks = await getRelevantChunks(documentId, message);
    if (chunks.length === 0) {
      return res.json({
        answer: "This document appears to be empty or has no extractable text. I cannot analyze it.",
        sources: []
      });
    }

    // 3. Construct Context
    const contextText = chunks
      .map((c, i) => `[Source ${i + 1} - Page ${c.pageNumber}]:\n${c.text}`)
      .join('\n\n');

    // 4. Send to Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `You are a helpful document assistant. Answer the user's question based strictly on the document context provided.
If the context does not contain the answer, explain that the information is not present in the document. Do not extrapolate or use external facts outside the context.
Keep your answer clear, accurate, and concise.

Context:
${contextText}

Question:
${message}

Answer:`;

    const result = await model.generateContent(prompt);
    const answer = result.response.text().trim();

    // Map sources
    const sources = chunks.map((c, i) => ({
      sourceId: i + 1,
      pageNumber: c.pageNumber,
      snippet: c.text.slice(0, 120) + '...'
    }));

    res.json({
      answer,
      sources
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get summary of a specific document
// @route   POST /api/ai/summarize
// @access  Private
export const summarizeDocument = async (req, res) => {
  const { documentId } = req.body;

  if (!documentId) {
    return res.status(400).json({ message: 'documentId is required' });
  }

  if (!geminiEnabled || !genAI) {
    return res.status(503).json({ message: 'AI services are currently offline.' });
  }

  try {
    const document = await Document.findOne({ _id: documentId, owner: req.user._id });
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (document.summary) {
      return res.json({ summary: document.summary });
    }

    if (!document.extractedText) {
      return res.status(400).json({ message: 'No text extracted from this document to summarize.' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `Analyze the following document text and write a professional summary in 2-3 concise paragraphs. Highlight key points. Output ONLY the summary:\n\n${document.extractedText.slice(0, 15000)}`;
    const result = await model.generateContent(prompt);
    const summary = result.response.text().trim();

    document.summary = summary;
    await document.save();

    res.json({ summary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
