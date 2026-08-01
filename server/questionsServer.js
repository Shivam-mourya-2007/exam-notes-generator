const express = require('express');
const cors = require('cors');
require('dotenv').config();

const questionsRoute = require('./routes/questions.route');

const app = express();
const port = process.env.QUESTIONS_PORT || 5001;

const allowedOrigins = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Mount the questions route
app.use('/api', questionsRoute);

app.listen(port, () => {
  console.log(`Questions server running on port ${port}`);
});
