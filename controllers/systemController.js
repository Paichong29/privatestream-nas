const si = require('systeminformation');
const path = require('path');
const { db } = require('../database');

exports.getStats = async (req, res) => {
    try {
        const cpu = await si.currentLoad();
        const mem = await si.mem();
        const disk = await si.fsSize();
        const cpuInfo = await si.cpu();
        const time = si.time();

        // Get actual settings for cloud
        db.get("SELECT value FROM settings WHERE key = 'gdrive_connected'", (err, row) => {
            const gdriveConnected = row && row.value === 'true';

            // Get Local Disk (C: or /)
            const mainDisk = disk.find(d => d.mount === 'C:' || d.mount === '/') || disk[0];

            // Calculate "Cloud/External" by summing all other disks
            // This is "Real" data about what is actually mounted on the system.
            // If Google Drive is mounted via rclone/File Stream, it will appear here.
            let externalUsed = 0;
            let externalTotal = 0;

            disk.forEach(d => {
                if (d !== mainDisk) {
                    externalUsed += d.used;
                    externalTotal += d.size;
                }
            });

            // If specific setting enabled but no drive found, show 0 (REAL) instead of Mock 15GB.
            const cloudUsed = gdriveConnected ? externalUsed : 0;
            const cloudTotal = gdriveConnected ? externalTotal : 0;

            res.json({
                cpuUsage: Math.round(cpu.currentLoad),
                cpuModel: cpuInfo.brand,
                ramUsage: Math.round(mem.active),
                ramTotal: mem.total,
                storageLocalUsed: mainDisk ? mainDisk.used : 0,
                storageLocalTotal: mainDisk ? mainDisk.size : 0,
                storageCloudUsed: cloudUsed,
                storageCloudTotal: cloudTotal,
                uptime: time.uptime
            });
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to collect stats' });
    }
};

exports.getLogs = (req, res) => {
    db.all("SELECT * FROM system_logs ORDER BY timestamp DESC LIMIT 100", (err, rows) => {
        res.json(rows || []);
    });
};

exports.getNotifications = (req, res) => {
    db.all("SELECT * FROM notifications WHERE isRead = 0 ORDER BY createdAt DESC", (err, rows) => {
        res.json(rows || []);
    });
};

exports.markNotificationRead = (req, res) => {
    db.run("UPDATE notifications SET isRead = 1 WHERE id = ?", [req.params.id], () => {
        res.json({ message: 'Marked as read' });
    });
};

exports.getSettings = (req, res) => {
    db.all("SELECT * FROM settings", (err, rows) => {
        const settings = {};
        rows.forEach(r => settings[r.key] = r.value);
        res.json(settings);
    });
};

exports.updateSettings = (req, res) => {
    const settings = req.body;
    const stmts = [];
    Object.entries(settings).forEach(([key, value]) => {
        db.run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", [key, String(value)]);
    });
    res.json({ message: 'Settings updated' });
};
