const crypto = require('crypto');
const { db, logSystemEvent } = require('../database');

exports.getUsers = (req, res) => {
    // Only Admin can see users
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });

    db.all("SELECT id, username, email, role FROM users", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

exports.createUser = (req, res) => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });

    const { username, email, password, role } = req.body;
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    const id = 'u_' + crypto.randomBytes(4).toString('hex');

    db.run("INSERT INTO users (id, username, email, password, salt, role) VALUES (?, ?, ?, ?, ?, ?)",
        [id, username, email, hash, salt, role || 'VIEWER'],
        (err) => {
            if (err) return res.status(400).json({ error: 'Username or specific error' });
            logSystemEvent('INFO', 'User', `New user created: ${username}`);
            res.json({ message: 'User created' });
        }
    );
};

exports.deleteUser = (req, res) => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    const { id } = req.params;

    db.run("DELETE FROM users WHERE id = ?", [id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        logSystemEvent('WARN', 'User', `User deleted: ${id}`);
        res.json({ message: 'User deleted' });
    });
};
