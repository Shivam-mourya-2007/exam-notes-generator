const { getGeminiClient } = require('../utils/geminiClient');
const { safeParseJSON } = require('../utils/jsonUtils');

function getRelevantChunks(chunks, topic) {
  const keywords = [topic.topic, ...(topic.subtopics || [])]
    .map(k => k.toLowerCase());
  
  const matched = chunks.filter(chunk =>
    keywords.some(kw => chunk.toLowerCase().includes(kw))
  );
  
  return matched.length > 0 ? matched : chunks.slice(0, 2);
}

async function generateQuestions(blueprint, chunks) {
  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    let allQuestions = [];

    // Map each blueprint entry to a Promise
    const generationPromises = blueprint.map(async (entry) => {
      const relevantChunks = getRelevantChunks(chunks, entry);
      const textContext = relevantChunks.join('\n\n');

      const prompt = `
You are an expert University Exam Paper Setter.
Based ONLY on the provided text, generate the following number of questions for the topic "${entry.topic}":
- Short questions (2 marks): ${entry.shortQuestions}
- Medium questions (3-5 marks): ${entry.mediumQuestions}
- Long questions (7-10 marks): ${entry.longQuestions}
- Numerical questions: ${entry.numericals}

Assign a difficulty to each question: "Easy", "Medium", or "Hard". Aim for a realistic exam mix.

Output STRICTLY as a JSON object with this exact structure, NO markdown code fences:
{
  "questions": [
    { 
      "question": "What is ...?", 
      "type": "short", 
      "difficulty": "Easy", 
      "topic": "${entry.topic}" 
    }
  ]
}

Valid types are: "short", "medium", "long", "numerical".

Text Context:
${textContext}
`;
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      const parsed = safeParseJSON(responseText);
      if (parsed && Array.isArray(parsed.questions)) {
        return parsed.questions;
      }
      return [];
    });

    const results = await Promise.all(generationPromises);
    
    // Flatten the arrays
    for (const qArray of results) {
      allQuestions = allQuestions.concat(qArray);
    }

    console.log(`[Stage 4] Question generation complete. Draft questions: ${allQuestions.length}`);
    return allQuestions;
  } catch (error) {
    throw new Error(`[Stage 4 Failed] Error generating questions: ${error.message}`);
  }
}

module.exports = { generateQuestions };
