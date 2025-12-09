const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_THIS_IN_PRODUCTION_SECRET_KEY_999';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const tokenQuery = req.query.token;

    const finalToken = token || tokenQuery;

    if (!finalToken) return res.status(401).json({ error: 'Unauthorized: No token provided' });

    jwt.verify(finalToken, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Forbidden: Invalid token' });
        req.user = user;
        next();
    });
};

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: "Too many login attempts, please try again later" }
});

module.exports = { authenticateToken, loginLimiter, JWT_SECRET };
