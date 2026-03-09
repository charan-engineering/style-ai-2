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
app.use(express.json()); // Parse JSON bodies

// CORS Configuration — very permissive for Vercel/Production to prevent blockages
const corsOptions = {
    origin: '*', // Allow all origins in production to avoid Vercel edge issues
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable pre-flight across-the-board

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

// Start Server (Only if not running in Vercel)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`StyleAI Server running on port ${PORT}`);
  });
}

// Export for Vercel Serverless Functions
module.exports = app;
