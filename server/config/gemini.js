import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

let genAI = null;
let geminiEnabled = false;

if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    geminiEnabled = true;
    console.log('Gemini API configured successfully.');
  } catch (error) {
    console.log('Failed to initialize Gemini API:', error.message);
  }
} else {
  console.log('GEMINI_API_KEY is not configured in .env. AI Chat and Summarization will be unavailable.');
}

export { genAI, geminiEnabled };
