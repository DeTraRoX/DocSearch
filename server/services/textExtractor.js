import fs from 'fs';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { performOCR } from './ocrService.js';

/**
 * Extracts plain text from document based on file type
 * @param {string} filePath Local path to the file
 * @param {string} fileType One of 'pdf', 'docx', 'txt', 'image'
 * @returns {Promise<Object>} Object containing extracted text and array of page texts
 */
export const extractText = async (filePath, fileType) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File does not exist: ${filePath}`);
  }

  let text = '';
  let pages = [];

  switch (fileType) {
    case 'pdf': {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      text = data.text;
      
      // Separate pages by Form Feed character
      if (text.includes('\u000c')) {
        pages = text.split('\u000c').map(p => p.trim()).filter(Boolean);
      } else if (text.includes('\f')) {
        pages = text.split('\f').map(p => p.trim()).filter(Boolean);
      } else {
        // If form feed is not present, try splitting by common page-breaks or treat as a single page
        pages = [text];
      }
      break;
    }
    case 'docx': {
      const result = await mammoth.extractRawText({ path: filePath });
      text = result.value;
      pages = [text];
      break;
    }
    case 'txt': {
      text = await fs.promises.readFile(filePath, 'utf-8');
      pages = [text];
      break;
    }
    case 'image': {
      text = await performOCR(filePath);
      pages = [text];
      break;
    }
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }

  // Sanitize text
  text = text.replace(/\0/g, '').trim();
  pages = pages.map(p => p.replace(/\0/g, '').trim());

  return { text, pages };
};

/**
 * Splits extracted text into semantic chunks for RAG and search
 * @param {string} text The full document text
 * @param {Array<string>} pages The list of text page-by-page (optional)
 * @returns {Array<Object>} List of chunks { text, pageNumber, chunkIndex }
 */
export const chunkText = (text, pages = [], chunkSize = 800, overlap = 150) => {
  const chunks = [];
  let chunkIndex = 0;

  if (pages && pages.length > 0) {
    pages.forEach((pageText, index) => {
      const pageNumber = index + 1;
      if (pageText.length <= chunkSize) {
        if (pageText.trim()) {
          chunks.push({
            text: pageText,
            pageNumber,
            chunkIndex: chunkIndex++
          });
        }
      } else {
        let start = 0;
        while (start < pageText.length) {
          const end = start + chunkSize;
          const chunkStr = pageText.slice(start, end);
          if (chunkStr.trim()) {
            chunks.push({
              text: chunkStr,
              pageNumber,
              chunkIndex: chunkIndex++
            });
          }
          start += (chunkSize - overlap);
        }
      }
    });
  } else {
    let start = 0;
    while (start < text.length) {
      const end = start + chunkSize;
      const chunkStr = text.slice(start, end);
      if (chunkStr.trim()) {
        chunks.push({
          text: chunkStr,
          pageNumber: 1,
          chunkIndex: chunkIndex++
        });
      }
      start += (chunkSize - overlap);
    }
  }

  return chunks;
};
