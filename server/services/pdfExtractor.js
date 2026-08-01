const pdfParse = require('pdf-parse');
const { chunkText } = require('../utils/textChunker');

async function extractPdfText(pdfBuffer) {
  try {
    const data = await pdfParse(pdfBuffer);
    
    // Clean extra whitespace and line breaks
    const cleanedText = data.text
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive line breaks
      .trim();

    const chunks = chunkText(cleanedText, 500); // chunk by ~500 words
    
    // Calculate approximate total words
    const totalWords = chunks.reduce((acc, chunk) => acc + chunk.split(/\s+/).length, 0);

    console.log(`[Stage 1] PDF extraction complete. Chunks: ${chunks.length}, Words: ~${totalWords}`);
    return chunks;
  } catch (error) {
    throw new Error(`[Stage 1 Failed] Error extracting PDF text: ${error.message}`);
  }
}

module.exports = { extractPdfText };
