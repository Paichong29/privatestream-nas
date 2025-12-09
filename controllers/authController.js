const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { db, logSystemEvent } = require('../database');
const { JWT_SECRET } = require('../middleware/auth');

exports.login = (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
        if (err || !user) return res.status(401).json({ error: 'Invalid credentials' });

        const hash = crypto.pbkdf2Sync(password, user.salt, 1000, 64, 'sha512').toString('hex');
        if (hash === user.password) {
            const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
            logSystemEvent('INFO', 'Auth', `User ${username} logged in`);
            res.json({
                user: { id: user.id, username: user.username, role: user.role, email: user.email },
                token
            });
        } else {
            logSystemEvent('WARN', 'Auth', `Failed login attempt for ${username}`);
            res.status(401).json({ error: 'Invalid credentials' });
        }
    });
};

exports.changePassword = (req, res) => {
    const { userId, oldPassword, newPassword } = req.body;
    db.get("SELECT * FROM users WHERE id = ?", [userId], (err, user) => {
        if (err || !user) return res.status(404).json({ error: 'User not found' });

        const hash = crypto.pbkdf2Sync(oldPassword, user.salt, 1000, 64, 'sha512').toString('hex');
        if (hash !== user.password) {
            return res.status(401).json({ error: 'Incorrect old password' });
        }

        const newSalt = crypto.randomBytes(16).toString('hex');
        const newHash = crypto.pbkdf2Sync(newPassword, newSalt, 1000, 64, 'sha512').toString('hex');

        db.run("UPDATE users SET password = ?, salt = ? WHERE id = ?", [newHash, newSalt, userId], (err) => {
            if (err) return res.status(500).json({ error: 'Failed to update password' });
            logSystemEvent('SUCCESS', 'Auth', `Password changed for user ${user.username}`);
            res.json({ message: 'Password updated successfully' });
        });
    });
};

exports.forgotPassword = (req, res) => {
    const { email } = req.body;
    const token = crypto.randomBytes(20).toString('hex');
    const expiry = Date.now() + 3600000; // 1 hour

    db.run("UPDATE users SET resetToken = ?, resetTokenExpiry = ? WHERE email = ?", [token, expiry, email], function (err) {
        if (err) return res.status(500).json({ error: 'Database error' });
        // In production, send email here.
        logSystemEvent('INFO', 'Auth', `Password reset requested for ${email} (Token: ${token})`);
        res.json({ message: 'If email exists, reset instructions sent.' });
    });
};

exports.resetPasswordConfirm = (req, res) => {
    const { email, token, newPassword } = req.body;
    db.get("SELECT * FROM users WHERE email = ? AND resetToken = ? AND resetTokenExpiry > ?", [email, token, Date.now()], (err, user) => {
        if (!user) return res.status(400).json({ error: 'Invalid or expired token' });

        const newSalt = crypto.randomBytes(16).toString('hex');
        const newHash = crypto.pbkdf2Sync(newPassword, newSalt, 1000, 64, 'sha512').toString('hex');

        db.run("UPDATE users SET password = ?, salt = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE id = ?", [newHash, newSalt, user.id], (err) => {
            if (err) return res.status(500).json({ error: 'Failed to reset password' });
            logSystemEvent('SUCCESS', 'Auth', `Password reset confirmed for ${user.username}`);
            res.json({ message: 'Password reset successful' });
        });
    });
};
