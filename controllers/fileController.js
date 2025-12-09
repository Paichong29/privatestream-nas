const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { db, logSystemEvent, createNotification } = require('../database');
const { UPLOAD_DIR } = require('../middleware/upload');

exports.getFiles = (req, res) => {
    db.all("SELECT * FROM files ORDER BY createdAt DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

exports.uploadFile = (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Generate file ID
    const fileId = crypto.randomBytes(8).toString('hex');
    const fileType = req.file.mimetype.startsWith('video') ? 'VIDEO'
        : req.file.mimetype.startsWith('image') ? 'IMAGE'
            : 'OTHER';

    const insertFile = (metadata = {}) => {
        db.run("INSERT INTO files (id, name, size, type, path, createdAt, storageLocation, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [fileId, req.file.originalname, req.file.size, fileType, req.file.filename, Date.now(), 'LOCAL', JSON.stringify(metadata)],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                if (err) return res.status(500).json({ error: err.message });
                logSystemEvent('INFO', 'File', `File uploaded: ${req.file.originalname}`);
                createNotification('UPLOAD', 'File Uploaded', `Successfully uploaded ${req.file.originalname}`);
                db.get("SELECT * FROM files WHERE id = ?", [fileId], (err, row) => res.json(row));
            }
        );
    };

    if (fileType === 'VIDEO') {
        const ffmpeg = require('fluent-ffmpeg');
        // If ffmpeg is in path, this works. If not, deployment guide says to install it.
        ffmpeg.ffprobe(req.file.path, (err, metadata) => {
            if (err) {
                // If probe fails (corrupt video or no ffmpeg), save without meta
                return insertFile({ error: 'Probe failed' });
            }

            const videoStream = metadata.streams.find(s => s.codec_type === 'video');
            const audioStream = metadata.streams.find(s => s.codec_type === 'audio');

            const realMeta = {
                resolution: videoStream ? `${videoStream.width}x${videoStream.height}` : 'unknown',
                codec: videoStream ? videoStream.codec_name : 'unknown',
                audioCodec: audioStream ? audioStream.codec_name : 'unknown',
                duration: metadata.format.duration,
                bitrate: metadata.format.bit_rate ? Math.round(metadata.format.bit_rate / 1000) + ' kb/s' : 'unknown',
                container: metadata.format.format_name
            };
            insertFile(realMeta);
        });
    } else {
        insertFile({}); // No meta for images/others yet
    }
};

exports.deleteFile = (req, res) => {
    const { id } = req.params;
    db.get("SELECT * FROM files WHERE id = ?", [id], (err, file) => {
        if (!file) return res.status(404).json({ error: 'File not found' });

        const filePath = path.join(UPLOAD_DIR, file.path);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        db.run("DELETE FROM files WHERE id = ?", [id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            logSystemEvent('INFO', 'File', `File deleted: ${file.name}`);
            res.json({ message: 'Deleted' });
        });
    });
};

exports.renameFile = (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    db.run("UPDATE files SET name = ? WHERE id = ?", [name, id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Renamed' });
    });
};

exports.toggleTier = (req, res) => {
    const { id } = req.params;
    db.get("SELECT * FROM files WHERE id = ?", [id], (err, file) => {
        if (!file) return res.status(404).json({ error: 'File not found' });
        const newLoc = file.storageLocation === 'LOCAL' ? 'CLOUD' : 'LOCAL';
        db.run("UPDATE files SET storageLocation = ? WHERE id = ?", [newLoc, id], (err) => {
            res.json({ ...file, storageLocation: newLoc });
        });
    });
};

exports.downloadFile = (req, res) => {
    const { id } = req.params;
    db.get("SELECT * FROM files WHERE id = ?", [id], (err, file) => {
        if (!file) return res.status(404).json({ error: 'File not found' });

        // In real app, cloud files might need a redirect or stream proxy.
        // For now, we assume local or simulate.
        if (file.storageLocation === 'CLOUD') {
            // Simulate cloud stream
            // In production: return res.redirect(signedCloudUrl);
        }

        const filePath = path.join(UPLOAD_DIR, file.path);
        if (fs.existsSync(filePath)) {
            res.download(filePath, file.name);
        } else {
            res.status(404).json({ error: 'Physical file missing' });
        }
    });
};
