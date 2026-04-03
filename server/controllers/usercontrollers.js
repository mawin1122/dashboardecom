const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const connection = require('../config/db');
require('dotenv').config();


//post register
exports.register = (req, res) => {
    const { username, email, password } = req.body;

    // ✅ เช็คก่อนเลย
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const checkEmailQuery = 'SELECT * FROM users WHERE email = ?';

    connection.query(checkEmailQuery, [email], (err, results) => {
        if (err) {
            console.error('Error checking email:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        // ✅ ถ้ามี email แล้ว
        if (results.length > 0) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // ✅ ค่อย hash + insert
        const hashedPassword = bcrypt.hashSync(password, 10);

        const insertQuery = 'INSERT INTO users (username, email, password, role, point) VALUES (?, ?, ?, ?, ?)';

        // ✅ ใช้ parameterized query เพื่อป้องกัน SQL injection
        // insert default role as 'user' and default point as 0
        connection.query(insertQuery, [username, email, hashedPassword, 'user', 0], (err, result) => {
            if (err) {
                console.error('Error registering user:', err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }
            return res.status(201).json({ message: 'User registered successfully' });
        });
    });
};
exports.login = (req, res) => {
    const { email, password } = req.body;
    const query = 'SELECT * FROM users WHERE email = ?';
    connection.query(query, [email], (err, results) => {
        if (err) {
            console.error('Error logging in:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const user = results[0];
        const normalizedRole = String(user.role || 'user').trim().toLowerCase();
        const passwordMatch = bcrypt.compareSync(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Password does not match' });
        }

        req.session.userId = user.id;
        req.session.userRole = normalizedRole;

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: normalizedRole,
            },
            process.env.JWT_SECRET || 'mysecret',
            { expiresIn: '7d' }
        );

        res.json({
            message: 'เข้าสู่ระบบสำเร็จ',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: normalizedRole,
            },
        });
        console.log('Login successful:', { id: user.id, email: user.email });
    });
};

exports.getProfile = (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const query = 'SELECT id, username, email, role FROM users WHERE id = ?';
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

exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.json({ message: 'ออกจากระบบสำเร็จ' });
    });
};

const normalizeRole = (role) => {
    const safeRole = String(role || 'user').trim().toLowerCase();
    return safeRole === 'admin' ? 'admin' : 'user';
};

exports.getUsers = (req, res) => {
    const query = 'SELECT id, username, email, role, point FROM users ORDER BY id DESC';
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        return res.json(results);
    });
};

exports.addUserByAdmin = (req, res) => {
    const { username, email, password, role, point } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email and password are required' });
    }

    const normalizedRole = normalizeRole(role);
    const safePoint = Number.isFinite(Number(point)) ? Number(point) : 0;
    const checkEmailQuery = 'SELECT id FROM users WHERE email = ? LIMIT 1';

    connection.query(checkEmailQuery, [email], (checkErr, checkResults) => {
        if (checkErr) {
            console.error('Error checking existing email:', checkErr);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        if (checkResults.length > 0) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);
        const insertQuery = 'INSERT INTO users (username, email, password, role, point) VALUES (?, ?, ?, ?, ?)';

        connection.query(insertQuery, [username, email, hashedPassword, normalizedRole, safePoint], (insertErr, result) => {
            if (insertErr) {
                console.error('Error adding user:', insertErr);
                return res.status(500).json({ error: 'Internal Server Error' });
            }

            return res.status(201).json({
                message: 'User added successfully',
                userId: result.insertId,
            });
        });
    });
};

exports.updateUserByAdmin = (req, res) => {
    const userId = Number(req.params.id);
    const { username, email, role, point } = req.body;
    const requesterId = Number(req.user?.id || 0);

    if (!Number.isInteger(userId) || userId <= 0) {
        return res.status(400).json({ error: 'Invalid user id' });
    }

    if (!username || !email) {
        return res.status(400).json({ error: 'Username and email are required' });
    }

    const normalizedRole = normalizeRole(role);
    const safePoint = Number.isFinite(Number(point)) ? Number(point) : 0;

    if (requesterId === userId && normalizedRole !== 'admin') {
        return res.status(400).json({ error: 'Cannot downgrade your own admin role' });
    }

    const checkEmailQuery = 'SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1';
    connection.query(checkEmailQuery, [email, userId], (checkErr, checkResults) => {
        if (checkErr) {
            console.error('Error checking duplicate email:', checkErr);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        if (checkResults.length > 0) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const updateQuery = 'UPDATE users SET username = ?, email = ?, role = ?, point = ? WHERE id = ?';
        connection.query(updateQuery, [username, email, normalizedRole, safePoint, userId], (updateErr, updateResult) => {
            if (updateErr) {
                console.error('Error updating user:', updateErr);
                return res.status(500).json({ error: 'Internal Server Error' });
            }

            if (updateResult.affectedRows === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            return res.json({ message: 'User updated successfully' });
        });
    });
};

exports.deleteUserByAdmin = (req, res) => {
    const userId = Number(req.params.id);
    const requesterId = Number(req.user?.id || 0);

    if (!Number.isInteger(userId) || userId <= 0) {
        return res.status(400).json({ error: 'Invalid user id' });
    }

    if (userId === requesterId) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const query = 'DELETE FROM users WHERE id = ?';
    connection.query(query, [userId], (err, result) => {
        if (err) {
            console.error('Error deleting user:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.json({ message: 'User deleted successfully' });
    });
};

