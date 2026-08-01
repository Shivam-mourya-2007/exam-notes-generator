const { getGeminiClient } = require('../utils/geminiClient');
const { safeParseJSON } = require('../utils/jsonUtils');

async function extractTopics(chunks) {
  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Join chunks for topic extraction, but we limit to the first few if it's too large, 
    // or just send all if gemini-2.5-flash can handle it. We will send all chunks for a comprehensive topic list,
    // joined together. The prompt asks for strict JSON.
    const fullText = chunks.join('\n\n');

    const prompt = `
You are an expert University Curriculum Designer.
Analyze the following text and extract the core educational topics, subtopics, definitions, and formulae.
Determine the importance of each topic based on typical university syllabus structure (High, Medium, or Low).

Provide the output STRICTLY as a JSON object with this exact structure, with NO markdown code fences or other text:
{
  "topics": [
    {
      "name": "Topic Name",
      "subtopics": ["subtopic 1", "subtopic 2"],
      "definitions": ["definition 1"],
      "formulae": ["formula 1"],
      "importance": "High"
    }
  ]
}

Text to analyze:
${fullText}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    const parsedData = safeParseJSON(responseText);
    
    if (!parsedData || !parsedData.topics || !Array.isArray(parsedData.topics)) {
      throw new Error('Invalid JSON structure returned from Gemini.');
    }

    console.log(`[Stage 2] Topic extraction complete. Topics found: ${parsedData.topics.length}`);
    return parsedData.topics;
  } catch (error) {
    throw new Error(`[Stage 2 Failed] Error extracting topics: ${error.message}`);
  }
}

module.exports = { extractTopics };
