function getWordSet(text) {
  // Extract alphabetic words, lowercased
  const words = text.toLowerCase().match(/[a-z]+/g) || [];
  return new Set(words);
}

function calculateSimilarity(str1, str2) {
  const set1 = getWordSet(str1);
  const set2 = getWordSet(str2);
  
  if (set1.size === 0 && set2.size === 0) return 1.0;
  if (set1.size === 0 || set2.size === 0) return 0.0;
  
  let intersection = 0;
  for (const word of set1) {
    if (set2.has(word)) intersection++;
  }
  
  const union = set1.size + set2.size - intersection;
  return intersection / union; // Jaccard Similarity
}

function removeDuplicates(questions) {
  try {
    const uniqueQuestions = [];
    
    for (const q of questions) {
      let isDuplicate = false;
      for (const existing of uniqueQuestions) {
        // Compare only within same type and topic for speed, 
        // but overall similarity is fine too.
        if (q.type === existing.type) {
          const sim = calculateSimilarity(q.question, existing.question);
          if (sim > 0.7) { // >70% similar
            isDuplicate = true;
            break;
          }
        }
      }
      if (!isDuplicate) {
        uniqueQuestions.push(q);
      }
    }

    console.log(`[Stage 5] Duplicate removal complete. Questions after dedup: ${uniqueQuestions.length}`);
    return uniqueQuestions;
  } catch (error) {
    throw new Error(`[Stage 5 Failed] Error removing duplicates: ${error.message}`);
  }
}

module.exports = { removeDuplicates };
