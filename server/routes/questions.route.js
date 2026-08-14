const express = require('express');
const multer = require('multer');
const { extractTopics } = require('../services/topicExtractor');
const { buildBlueprint } = require('../services/blueprintBuilder');
const { generateQuestions } = require('../services/questionGenerator');
const { removeDuplicates } = require('../services/duplicateRemover');
const { balanceDifficulty } = require('../services/difficultyBalancer');
const { formatToMarkdown } = require('../services/markdownFormatter');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.post('/generate-questions', upload.single('pdf'), async (req, res) => {
  try {
    console.log(`[${new Date().toISOString()}] POST /api/generate-questions - Request received.`);
    
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded.' });
    }
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Invalid file format. Please upload a PDF.' });
    }

    // Stage 1
    // Load the PDF parser only when this route is requested. This keeps the
    // independent notes-generation API available during a parser failure.
    const { extractPdfText } = require('../services/pdfExtractor');
    const chunks = await extractPdfText(req.file.buffer);
    
    // Stage 2
    const topics = await extractTopics(chunks);
    
    // Stage 3
    const blueprint = buildBlueprint(topics);
    
    // Stage 4
    const draftQuestions = await generateQuestions(blueprint, chunks);
    
    // Stage 5
    const uniqueQuestions = removeDuplicates(draftQuestions);
    
    // Stage 6
    const balancedQuestions = await balanceDifficulty(uniqueQuestions, topics);
    
    // Stage 7
    const finalMarkdown = formatToMarkdown(balancedQuestions);

    res.json({ questions: finalMarkdown });

  } catch (error) {
    console.error(`Error in generate-questions route:`, error);
    // Graceful error handling
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
