const connection = require('../config/db');

// ระบบจัดการปู้ใช่
exports.getUserProfile = (req, res) => {
    const userId = req.session?.userId;

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const query = 'SELECT * FROM users WHERE id = ?';
    connection.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching user profile:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(results[0]);
    });
};

exports.updateUserProfile = (req, res) => {
    const userId = req.session?.userId;
    const { username, email } = req.body;
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!username || !email) {
        return res.status(400).json({ error: 'Username and email are required' });
    }
    const query = 'UPDATE users SET username = ?, email = ? WHERE id = ?';
    connection.query(query, [username, email, userId], (err) => {
        if (err) {
            console.error('Error updating user profile:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.json({ message: 'User profile updated successfully' });
    });
};

exports.deleteUserProfile = (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const query = 'DELETE FROM users WHERE id = ?';
    connection.query(query, [userId], (err) => {
        if (err) {
            console.error('Error deleting user profile:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.json({ message: 'User profile deleted successfully' });
    });
};  