const { getGeminiClient } = require('../utils/geminiClient');
const { safeParseJSON } = require('../utils/jsonUtils');

async function balanceDifficulty(questions, topics) {
  try {
    let easyCount = 0;
    let mediumCount = 0;
    let hardCount = 0;

    for (const q of questions) {
      const diff = q.difficulty ? q.difficulty.toLowerCase() : '';
      if (diff === 'easy') easyCount++;
      else if (diff === 'medium') mediumCount++;
      else if (diff === 'hard') hardCount++;
      else mediumCount++; // Default to medium
    }

    const total = questions.length;
    if (total === 0) {
      console.log(`[Stage 6] Difficulty check — Easy: 0, Medium: 0, Hard: 0 — Balanced: true`);
      return questions;
    }

    const easyRatio = easyCount / total;
    const mediumRatio = mediumCount / total;
    const hardRatio = hardCount / total;

    // Targets: 40% Easy, 40% Medium, 20% Hard
    // We allow some tolerance (e.g., +/- 10%)
    const isBalanced = 
      easyRatio >= 0.30 && easyRatio <= 0.50 &&
      mediumRatio >= 0.30 && mediumRatio <= 0.50 &&
      hardRatio >= 0.10 && hardRatio <= 0.30;

    if (isBalanced) {
      console.log(`[Stage 6] Difficulty check — Easy: ${easyCount}, Medium: ${mediumCount}, Hard: ${hardCount} — Balanced: true`);
      return questions;
    }

    console.log(`[Stage 6] Difficulty check — Easy: ${easyCount}, Medium: ${mediumCount}, Hard: ${hardCount} — Balanced: false. Attempting retry...`);

    // Identify which category is short
    let missingCategory = '';
    let missingCount = 0;

    const targetEasy = Math.round(total * 0.40);
    const targetMedium = Math.round(total * 0.40);
    const targetHard = Math.round(total * 0.20);

    if (easyCount < targetEasy) {
      missingCategory = 'Easy';
      missingCount = targetEasy - easyCount;
    } else if (mediumCount < targetMedium) {
      missingCategory = 'Medium';
      missingCount = targetMedium - mediumCount;
    } else if (hardCount < targetHard) {
      missingCategory = 'Hard';
      missingCount = targetHard - hardCount;
    }

    if (missingCount <= 0) {
      // Something unexpected, maybe overall question counts are very small, just return.
      return questions;
    }

    // Call Gemini to generate missing questions
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    // Provide some topics as context
    const topicNames = topics.slice(0, 3).map(t => t.name || t.topic).join(', ');

    const prompt = `
You are an expert University Exam Paper Setter.
Generate exactly ${missingCount} more "${missingCategory}" difficulty questions based on these topics: ${topicNames}.
Assign a mix of types (short, medium, long, numerical) appropriately.

Output STRICTLY as a JSON object with this exact structure, NO markdown code fences:
{
  "questions": [
    { 
      "question": "What is ...?", 
      "type": "medium", 
      "difficulty": "${missingCategory}", 
      "topic": "Some topic" 
    }
  ]
}
`;
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    const parsed = safeParseJSON(responseText);
    let newQuestions = [];
    
    if (parsed && Array.isArray(parsed.questions)) {
      newQuestions = parsed.questions.map(q => ({
        ...q,
        difficulty: missingCategory // Force it just in case
      }));
    }

    const finalQuestions = questions.concat(newQuestions);
    
    // Recalculate for logging
    let finalEasy = easyCount;
    let finalMedium = mediumCount;
    let finalHard = hardCount;
    
    if (missingCategory === 'Easy') finalEasy += newQuestions.length;
    else if (missingCategory === 'Medium') finalMedium += newQuestions.length;
    else if (missingCategory === 'Hard') finalHard += newQuestions.length;

    console.log(`[Stage 6] Retry complete. New counts — Easy: ${finalEasy}, Medium: ${finalMedium}, Hard: ${finalHard}`);
    return finalQuestions;

  } catch (error) {
    // If retry fails, we just return the existing questions, but wrap it in our error handling if we want strict failing.
    // The instructions say "graceful failure: if ANY stage throws an error...", so we will throw.
    throw new Error(`[Stage 6 Failed] Error balancing difficulty: ${error.message}`);
  }
}

module.exports = { balanceDifficulty };
