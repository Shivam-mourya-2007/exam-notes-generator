/**
 * Splits text into chunks of approximately `maxWords` words.
 * Attempts to preserve paragraphs if possible.
 */
function chunkText(text, maxWords = 500) {
  if (!text) return [];

  // Split by paragraphs first (double line breaks)
  const paragraphs = text.split(/\n\s*\n/);
  const chunks = [];
  let currentChunk = [];
  let currentWordCount = 0;

  for (const paragraph of paragraphs) {
    const wordCount = paragraph.trim().split(/\s+/).length;
    
    // If a single paragraph is too long, we might need to split it further, 
    // but for simplicity, we'll just add it to the current chunk or start a new one.
    if (currentWordCount + wordCount > maxWords && currentChunk.length > 0) {
      chunks.push(currentChunk.join('\n\n'));
      currentChunk = [paragraph];
      currentWordCount = wordCount;
    } else {
      currentChunk.push(paragraph);
      currentWordCount += wordCount;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('\n\n'));
  }

  return chunks;
}

module.exports = { chunkText };
