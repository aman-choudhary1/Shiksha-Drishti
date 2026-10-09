require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth.routes');
const masterDataRoutes = require('./routes/masterData.routes');
const assessmentRoutes = require('./routes/assessment.routes');
const assessmentQuestionBankRoutes = require('./routes/assessmentQuestionBank.routes');
const mobileAssessmentRoutes = require('./routes/mobileAssessment.routes');
const principalRoutes = require('./routes/principal.routes');
const clusterRoutes = require('./routes/cluster.routes');
const districtRoutes = require('./routes/district.routes');
const blockRoutes = require('./routes/block.routes');
const stateRoutes = require('./routes/state.routes');
const academicDataRoutes = require('./routes/academicData.routes');

const app = express();

app.set('trust proxy', 1);

// Security headers with Cross-Origin Resource Policy allowed for images
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Rate limiting (generous for development, protects against brute-force in production)
const isDev = process.env.NODE_ENV !== 'production';

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: isDev ? 5000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
  message: { error: 'Too many requests, please try again later' },
});

const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: isDev ? 1000 : 10,
  skip: () => isDev,
  message: { error: 'Too many login attempts, please try again later' },
});

app.use(limiter);
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => res.json({
  status: 'ok',
  app: 'SHIKSHA DRISHTI API',
  version: '1.0.0',
  timestamp: new Date().toISOString(),
}));

// Static image uploads directory for questions and options
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/mobile/assessments', mobileAssessmentRoutes);
app.use('/api/question-bank', assessmentQuestionBankRoutes);
app.use('/api/app-assessments', assessmentQuestionBankRoutes);
app.use('/api', masterDataRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/principal', principalRoutes);
app.use('/api/cluster', clusterRoutes);
app.use('/api/block', blockRoutes);
app.use('/api/district', districtRoutes);
app.use('/api/state', stateRoutes);
app.use('/api/academic', academicDataRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Error handler
app.use(errorHandler);

module.exports = app;
