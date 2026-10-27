const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Ensure database and schema are initialized
require('./db');

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Static uploads serving
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/verification', require('./routes/verification'));
app.use('/api/compliance', require('./routes/compliance'));
app.use('/api/infrastructure', require('./routes/infrastructure'));
app.use('/api/reviewer', require('./routes/reviewer'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/audit', require('./routes/audit'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/reset-demo', require('./routes/resetDemo'));

// Root healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    product: 'Aurexa VerifyAI',
    tagline: 'Intelligent Verification. Transparent Compliance. Faster Decisions.',
    organization: 'AICTE - All India Council for Technical Education',
    theme: 'Smart Automation',
    problemStatement: 'SIH26261',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Aurexa VerifyAI Backend API running on port ${PORT}`);
  console.log(`🏛️ AICTE Application Validation & Compliance Engine`);
  console.log(`🌐 Health endpoint: http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});
