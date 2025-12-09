const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Setup Paths
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'privatestream.db');

// Ensure Dir
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new sqlite3.Database(DB_PATH);
db.pragma('journal_mode = WAL'); // Enable Write-Ahead Logging for better concurrency

const logger = require('../utils/logger');
// Backward compatibility adapter
const logSystemEvent = (level, service, message) => {
    logger.info(`[${level}] ${service}: ${message}`);
    const id = crypto.randomBytes(8).toString('hex');
    const timestamp = new Date().toISOString();
    db.run("INSERT INTO system_logs (id, timestamp, level, service, message) VALUES (?, ?, ?, ?, ?)",
        [id, timestamp, level, service, message], (err) => {
            if (err) logger.error('Failed to write log to DB', err);
        });
};

const createNotification = (type, title, message) => {
    const id = crypto.randomBytes(8).toString('hex');
    const createdAt = Date.now();
    db.run("INSERT INTO notifications (id, type, title, message, isRead, createdAt) VALUES (?, ?, ?, ?, 0, ?)",
        [id, type, title, message, createdAt], (err) => {
            if (err) logger.error('Failed to create notification', err);
        });
};

const initDB = () => {
    db.serialize(() => {
        // 1. Files Table
        db.run(`CREATE TABLE IF NOT EXISTS files (
            id TEXT PRIMARY KEY,
            name TEXT,
            size INTEGER,
            type TEXT,
            path TEXT,
            createdAt INTEGER,
            storageLocation TEXT DEFAULT 'LOCAL',
            aiDescription TEXT,
            aiTags TEXT,
            metadata TEXT
        )`);

        // 2. Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE,
            email TEXT,
            password TEXT,
            salt TEXT,
            role TEXT,
            resetToken TEXT,
            resetTokenExpiry INTEGER
        )`);

        // 3. Notifications Table
        db.run(`CREATE TABLE IF NOT EXISTS notifications (
            id TEXT PRIMARY KEY,
            type TEXT,
            title TEXT,
            message TEXT,
            isRead INTEGER DEFAULT 0,
            createdAt INTEGER
        )`);

        // 4. System Logs Table
        db.run(`CREATE TABLE IF NOT EXISTS system_logs (
            id TEXT PRIMARY KEY,
            timestamp TEXT,
            level TEXT,
            service TEXT,
            message TEXT
        )`);

        // 5. Settings Table
        db.run(`CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )`);

        // Initialize Default Settings
        const defaultSettings = {
            'gdrive_connected': 'false',
            'retention_days': '30',
            'rclone_cache': 'full',
            'transcoding_hw': 'Intel QSV'
        };

        Object.entries(defaultSettings).forEach(([key, val]) => {
            db.run("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", [key, val]);
        });

        // Initialize Default Admin
        db.get("SELECT * FROM users WHERE username = 'admin'", (err, row) => {
            if (!row) {
                const salt = crypto.randomBytes(16).toString('hex');
                const hash = crypto.pbkdf2Sync('admin', salt, 1000, 64, 'sha512').toString('hex');

                db.run("INSERT INTO users (id, username, email, password, salt, role) VALUES (?, ?, ?, ?, ?, ?)",
                    ['u_admin', 'admin', 'admin@privatestream.local', hash, salt, 'ADMIN'],
                    (err) => {
                        if (!err) logSystemEvent('SUCCESS', 'Auth', 'Default admin user initialized');
                    }
                );
            }
        });
    });
};

module.exports = { db, initDB, logSystemEvent, createNotification };
