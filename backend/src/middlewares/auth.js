const jwt = require('jsonwebtoken');
const {JWT_SECRET} = require('../config/env');

function auth(req, res, next) {
    const header = req.headers.authorization;
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if(!token) {
        return res.status(401).json({
            code: 401,
            message: 'Unauthorized'
        });
    }
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    } catch (error) {
        return res.status(401).json({
            code: 401,
            message: 'Unauthorized',
            error: error.message
        });
    }
}

module.exports = {
    auth
};