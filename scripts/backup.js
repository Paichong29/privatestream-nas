const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const logger = require('../utils/logger');
const { db } = require('../database');

const DB_PATH = path.join(__dirname, '../data/privatestream.db');
const BACKUP_DIR = path.join(__dirname, '../backups');

if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const backupDatabase = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.db`);

    // Use SQLite Online Backup API if possible, or simple file copy for WAL mode safe-ish copy.
    // The safest way in Node without stopping app is using the SQLite backup API or VACUUM INTO.
    // sqlite3 node lib doesn't expose backup API easily?
    // Actually, VACUUM INTO is great.
    
    const sql = `VACUUM INTO '${backupFile}'`;
    
    logger.info('Starting database backup...');
    db.run(sql, (err) => {
        if (err) {
            logger.error('Backup failed:', err);
        } else {
            logger.info(`Backup successful: ${backupFile}`);
            // Cleanup old backups (keep last 7 days)
            cleanupOldBackups();
        }
    });
};

const cleanupOldBackups = () => {
    fs.readdir(BACKUP_DIR, (err, files) => {
        if (err) return;
        const now = Date.now();
        const MAX_AGE = 7 * 24 * 60 * 60 * 1000;
        
        files.forEach(file => {
             const filePath = path.join(BACKUP_DIR, file);
             fs.stat(filePath, (err, stats) => {
                 if (err) return;
                 if (now - stats.mtimeMs > MAX_AGE) {
                     fs.unlink(filePath, () => logger.info(`Deleted old backup: ${file}`));
                 }
             });
        });
    });
};

// If run directly
if (require.main === module) {
    backupDatabase();
}

module.exports = backupDatabase;
