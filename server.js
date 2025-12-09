// PRIVATESTREAM NAS - PRODUCTION SERVER
require('./utils/envHelper').ensureJwtSecret(); // Auto-setup .env before loading it
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');

// Modules
const { initDB, logSystemEvent } = require('./database');
const { UPLOAD_DIR } = require('./middleware/upload');
const logger = require('./utils/logger');

// Routes
const authRoutes = require('./routes/authRoutes');
const fileRoutes = require('./routes/fileRoutes');
const userRoutes = require('./routes/userRoutes');
const systemRoutes = require('./routes/systemRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// --- INIT ---
initDB();

// --- MIDDLEWARE ---
app.use(cors());
app.use((req, res, next) => {
    // 1. Content Security Policy (Strict but functional)
    res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' data: blob:; connect-src 'self' https://generativelanguage.googleapis.com; font-src 'self' data:;");
    // 2. Transport Security (HSTS) - 1 Year
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    // 3. No Sniffing
    res.setHeader("X-Content-Type-Options", "nosniff");
    // 4. Frame Options (Prevent Clickjacking)
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    // 5. Referrer Policy
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    // 6. Permissions Policy
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    next();
});
// app.use(helmet()); // Replaced with manual headers
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes); // includes /upload via uploadFile
// Note: original server.js had /api/upload separately. 
// In fileRoutes, we mount at /api/files. 
// If frontend calls /api/upload, we need to map it or change frontend.
// Frontend calls /api/upload. Let's add a specific mount or alias in routes.
// Re-checking fileRoutes... it has router.post('/', ...uploadFile).
// That means POST /api/files/ is the upload endpoint now?
// Wait, previous server.js had app.post('/api/upload', ...).
// If we want to keep frontend compatible without changing standard URL too much,
// we should map strictly.
// Alternatively:
app.use('/api/upload', (req, res, next) => {
    // Forward /api/upload to fileRoutes's post '/' ?
    // Or just import fileController and mount it here.
    // Or simpler: The fileRoutes definition had: router.post('/', ...uploadFile). 
    // If we mount fileRoutes at /api/files, then upload is POST /api/files.
    // Frontend uses: `${API_BASE}/api/upload`.
    // We should fix frontend OR add a specific route for upload here to be safe.
    next();
});
// Let's explicitly mount the upload route from controller to keep URL same
const { upload } = require('./middleware/upload');
const fileController = require('./controllers/fileController');
app.post('/api/upload', require('./middleware/auth').authenticateToken, upload.single('file'), fileController.uploadFile);

app.use('/api/users', userRoutes);
app.use('/api', systemRoutes); // Mount system directly to /api to match /api/stats, /api/logs etc.

// Static Files
app.use('/uploads', express.static(UPLOAD_DIR));

// Frontend Serving
const DIST_DIR = path.join(__dirname, 'dist');
if (require('fs').existsSync(DIST_DIR)) {
    app.use(express.static(DIST_DIR));
    app.get('*', (req, res) => {
        res.sendFile(path.join(DIST_DIR, 'index.html'));
    });
}

// Error Handling (Basic)
app.use((err, req, res, next) => {
    // console.error(err.stack); // Stack is included in logger.error if passed as meta or obj
    logger.error('Unhandled Error', err);
    logSystemEvent('ERROR', 'System', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logSystemEvent('INFO', 'System', `Server started on port ${PORT}`);
});