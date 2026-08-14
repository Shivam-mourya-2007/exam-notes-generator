const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const { db, storage, FieldValue } = require('./firebaseAdmin');
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

    let storagePath = '';
    let downloadURL = '';
    
    // Upload PDF to Firebase Storage
    if (req.body.uid && db && storage) {
      try {
        const timestamp = Date.now();
        const safeName = req.file.originalname ? req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_') : 'document.pdf';
        storagePath = `users/${req.body.uid}/pdfs/${timestamp}_${safeName}`;
        
        const fileRef = storage.bucket().file(storagePath);
        await fileRef.save(req.file.buffer, {
          metadata: {
            contentType: 'application/pdf',
            metadata: {
              originalName: req.file.originalname,
              uid: req.body.uid
            }
          }
        });
        
        // Make the file publicly accessible to get a download URL (optional, depends on security rules)
        // For now, we'll just store the path. We can get a signed URL if needed later.
        downloadURL = `https://firebasestorage.googleapis.com/v0/b/${storage.bucket().name}/o/${encodeURIComponent(storagePath)}?alt=media`;
        
        // Save to Firestore
        await db.collection('notes').add({
          uid: req.body.uid,
          fileName: req.file.originalname || 'document.pdf',
          notes: notes,
          createdAt: FieldValue.serverTimestamp(),
          storagePath: storagePath,
          downloadURL: downloadURL
        });
      } catch (uploadError) {
        console.error("Error during Storage/Firestore operation:", uploadError);
        // Even if upload fails, we still return notes so user isn't completely blocked
      }
    }

    res.json({ notes });

  } catch (error) {
    console.error('Error generating notes:', error);
    res.status(500).json({ error: `An error occurred: ${error.message}` });
  }
});

// Delete Summary Route
app.delete('/api/history/:id', async (req, res) => {
  console.log(`[DELETE] Received request to delete summary. Route: /api/history/${req.params.id}`);
  
  if (!db || !storage) {
    console.error('[DELETE] Firebase Admin is not initialized (missing credentials).');
    return res.status(500).json({ error: 'Server misconfiguration: Missing Firebase Service Account credentials.' });
  }

  try {
    const { id } = req.params;
    if (!id) {
      console.error('[DELETE] Missing summary ID.');
      return res.status(400).json({ error: 'Missing summary ID.' });
    }

    console.log(`[DELETE] Attempting to find summary document with ID: ${id}`);
    const summaryRef = db.collection('notes').doc(id);
    const summaryDoc = await summaryRef.get();

    if (!summaryDoc.exists) {
      console.error(`[DELETE] Summary document not found in Firestore for ID: ${id}`);
      return res.status(404).json({ error: 'Summary not found.' });
    }

    const data = summaryDoc.data();
    const storagePath = data.storagePath;
    const uid = data.uid;

    console.log(`[DELETE] Document found.`);
    console.log(`[DELETE] -> document id: ${id}`);
    console.log(`[DELETE] -> uid: ${uid}`);
    console.log(`[DELETE] -> storagePath: ${storagePath}`);

    // 1. Delete from Firebase Storage first
    if (storagePath) {
      try {
        console.log(`[DELETE] Attempting to delete file from Firebase Storage: ${storagePath}`);
        const fileRef = storage.bucket().file(storagePath);
        await fileRef.delete();
        console.log(`[DELETE] Firebase Storage delete result: SUCCESS`);
      } catch (storageError) {
        // If file doesn't exist (e.g., 404), we might still want to delete the db record.
        // But the prompt says: "If Storage deletion fails, DO NOT delete the database document."
        console.error(`[DELETE] Firebase Storage delete result: FAILED`);
        console.error(`[DELETE] Exact Firebase Storage error:`, storageError);
        
        if (storageError.code !== 404) {
          return res.status(500).json({ error: 'Failed to delete file from storage. Database record intact.', details: storageError.message });
        } else {
          console.warn(`[DELETE] File not found in storage (404), proceeding to delete database record anyway...`);
        }
      }
    } else {
      console.warn(`[DELETE] No storagePath found for this document. Skipping Storage deletion.`);
    }

    // 2. Delete from Firestore
    try {
      console.log(`[DELETE] Attempting to delete document from Firestore: ${id}`);
      await summaryRef.delete();
      console.log(`[DELETE] Firestore delete result: SUCCESS`);
      res.status(200).json({ message: 'Summary deleted successfully.' });
    } catch (firestoreError) {
      console.error(`[DELETE] Firestore delete result: FAILED`);
      console.error(`[DELETE] Exact Firestore error:`, firestoreError);
      res.status(500).json({ error: 'Failed to delete database record.', details: firestoreError.message });
    }

  } catch (error) {
    console.error('[DELETE] Unhandled error during deletion:', error);
    res.status(500).json({ error: `An error occurred while deleting: ${error.message}` });
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
