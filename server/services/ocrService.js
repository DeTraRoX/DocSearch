import Tesseract from 'tesseract.js';

/**
 * Performs Optical Character Recognition (OCR) on an image file
 * @param {string} filePath Absolute or relative path to the image
 * @returns {Promise<string>} Extracted text
 */
export const performOCR = async (filePath) => {
  try {
    const { data: { text } } = await Tesseract.recognize(
      filePath,
      'eng'
    );
    return text;
  } catch (error) {
    console.log('OCR Extraction Error:', error.message);
    throw new Error(`Failed to extract text from image using OCR: ${error.message}`);
  }
};
