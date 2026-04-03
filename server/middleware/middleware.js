const connection = require('../config/db');
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7).trim();
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mysecret');
            req.user = {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role || 'user',
            };
            return next();
        } catch (error) {
            return res.status(401).json({ error: 'Invalid token' });
        }
    }

    const userId = req.session?.userId;

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const query = 'SELECT * FROM users WHERE id = ? LIMIT 1';
    connection.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error validating session user:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        if (results.length === 0) {
            return req.session.destroy(() => {
                res.clearCookie('connect.sid');
                return res.status(401).json({
                    error: 'Session invalid. User no longer exists.',
                    forceLogout: true,
                });
            });
        }

        req.user = {
            id: results[0].id,
            username: results[0].username,
            email: results[0].email,
            role: results[0].role || 'user',
        };
        return next();
    });
};

const adminMiddleware = (req, res, next) => {
    const role = String(req.user?.role || '').trim().toLowerCase();
    if (role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Forbidden' });
    }
};

module.exports = {
    authMiddleware,
    adminMiddleware,
};