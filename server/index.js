const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const questionsRoute = require('./routes/questions.route');

const app = express();
const port = process.env.PORT || 5000;

const allowedOrigins = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use('/api', questionsRoute);

// Set up Multer for handling file uploads (in memory)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/generate-notes', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded.' });
    }

    // Pass the PDF directly to Gemini (this handles math, scans, and images perfectly)
    const pdfPart = {
      inlineData: {
        data: req.file.buffer.toString('base64'),
        mimeType: 'application/pdf'
      }
    };

    // Call Gemini API
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
      You are an expert tutor creating study materials for college exam preparation. Please analyze the attached college document.
      Create student-friendly, highly compressed study notes focusing on conceptual understanding, not just copying textbook content.
      Do not rewrite the source paragraph by paragraph.
      Convert the uploaded PDF into highly readable, exam-oriented revision notes for a college student.
      Do NOT copy paragraphs from the source PDF. Compress the content to be highly revision-friendly.

      Output must be optimized for PDF printing and student readability.
      Do not use monospace fonts, code blocks, inline code, LaTeX blocks, or markdown syntax that reduces font size.
      Use bold headings, bold formulas, and bullet points only.
       Structure the notes using the following specific requirements:
      - *Clear Headings:* Use clear headings and subheadings for each topic.
      - *Simple Language:* Explain concepts in simple, easy-to-understand language.
      - *Structured Breakdown:* Clearly separate "Definitions", "Properties", and "Examples".
      - *Formulas:* Highlight important formulas clearly (e.g., using blockquotes or bold math blocks).
      - *Exam Tips:* Add an "Exam Tips" section outlining what is most likely to be tested.
      - *Common Mistakes:* Add a "Common Mistakes" section highlighting pitfalls students should avoid.
      - *Quick Revision Points:* Include brief "Quick Revision Points" at the end of each major topic.
      - *Formatting:* Use rich Markdown formatting including tables, bullet points, and bold text where appropriate.
      - *Math Formatting:* If there are math equations, format them properly using standard markdown math syntax.
      ════════════════════════════════
      PDF READABILITY & PAGINATION RULES (VERY IMPORTANT)
      ════════════════════════════════
      1. Notes will be exported to PDF. Output must be optimized for PDF printing and student readability.
      2. NEVER use code blocks (\`\`\`). NEVER use inline code (\`text\`). NEVER use monospace fonts or LaTeX blocks.
      3. Keep all text in normal paragraph or bullet formatting.
      4. Avoid Markdown tables unless absolutely necessary. If a table may become too wide for PDF rendering, convert it into a structured bullet-point comparison instead. PDF readability is more important than table usage.
      5. Keep headings with their immediate content. Prefer grouping content logically.
      6. Maintain consistent font size throughout the document. Never reduce font size for formulas, symbols, notation, variables, subscripts, or superscripts.
      7. Use every page efficiently. Do NOT leave large blank spaces. Maintain natural text flow like a professionally typeset textbook. Target page utilization above 90%.
      8. Explain concepts in simple language with short sentences.
      9. Write like you are teaching a friend.
      10. Use bullet points instead of long paragraphs.
      11. Highlight the most important concepts first.
      12. Convert worked examples into simplified exam-style examples.
      ════════════════════════════════
      MATHEMATICS & NOTATION RULES
      ════════════════════════════════
      1. Keep mathematical notation compact and highly readable.
      2. Do NOT replace symbols with long English sentences. Use standard Unicode mathematical symbols directly in normal text (e.g., ∀, ∃, ∈, ⊆, ∩, ∪, ×, ≠).
      3. Use bold formatting for: Definitions, Formulas, Important terms, Symbols, and notation.
      4. Keep mathematical symbols in normal text. Examples: **A × B**, **R⁻¹**, **A ⊆ B**, **P(S)**, **|A × B| = |A| × |B|**.
      5. Important formulas should appear directly in text as bold elements:
         **|A × B| = |A| × |B|**
         Do NOT put them inside code blocks or LaTeX blocks.
      6. FOR DISCRETE MATHS: Always show BOTH the notation and its plain-text meaning when introducing them. (e.g., **A ⊆ B** (Subset)).

      ════════════════════════════════
      CONTENT RULES & STRUCTURE
      ════════════════════════════════
      For every major topic, use exactly this structure:
      
      ## [Topic Name]

      ### What is it?
      One or two lines in plain English.

      ### Key Definitions & Properties
      - Use bullet points. Bold key terms.

      ### Important Formulas (ONLY if applicable)
      - [OMIT this entire section if the uploaded PDF does not contain formulas (e.g., History, Literature)]
      - Make formulas bold. Provide variable explanations.

      ### Exam Tip
      - Mention what is commonly asked in exams.

      ### Common Mistakes
      - Pitfalls students should avoid.

      ════════════════════════════════
      AT THE END OF THE NOTES
      ════════════════════════════════
      At the very end of the notes, you MUST generate the following 5 sections:

      ## 1. Chapter Snapshot
      - **[Topic Name]:** One Line Meaning (for all topics)

      ## 2. Formula Bank (ONLY if applicable)
      - [OMIT this entire section if the uploaded PDF does not contain formulas]
      - Topic Wise Formula List

      ## 3. Memory Hooks
      - keywords per concept
      - Easy recall sentence

      ## 4. Emergency Exam Recall
      - If the student forgets the formal definition, provide a simple keyword-based explanation that can help them remember the concept.

      ## 5. Last Minute Revision
      - Maximum 1 page length
      - Most important points only

      Do not include any introductory conversation. Output only the final Markdown notes directly.
    `;

    const result = await model.generateContent([prompt, pdfPart]);
    const notes = result.response.text();

    res.json({ notes });

  } catch (error) {
    console.error('Error generating notes:', error);
    res.status(500).json({ error: `An error occurred: ${error.message}` });
  }
});

// Keep the local development entry point while allowing Vercel to import the
// Express app as a serverless function.
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

module.exports = app;
