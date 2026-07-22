import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
  dotenv.config({ path: '.env.local', override: true });
}

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('Missing GEMINI_API_KEY. Set it in environment variables for production or .env.local for local development.');
}

export const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});
