const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;

function getGeminiClient() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY_QUESTIONS || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API Key is missing in environment variables.');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

module.exports = { getGeminiClient };
