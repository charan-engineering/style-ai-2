const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const analyseRoutes = require('./routes/analyse');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for rate limiting if behind a reverse proxy (e.g. Vercel/Railway)
app.set('trust proxy', 1);

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000'];

app.use(cors({
  origin: function(origin, callback) {
    if(!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(express.static(path.join(__dirname, '../public')));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: 'Too many requests from this IP, please try again after a minute'
});
app.use(limiter);

// API Routes
app.use('/api/analyse', analyseRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', gemini: !!process.env.GEMINI_API_KEY });
});

// Start Server
app.listen(PORT, () => {
  console.log(`StyleAI Server running on port ${PORT}`);
});
