const jwt = require('jsonwebtoken');
const {JWT_SECRET} = require('../config/env');
const promisePool = require('../config/database');

async function auth(req, res, next) {
    const header = req.headers.authorization;
    const token = header && header.startsWith('Bearer ') ? header.slice(7) : '';
    
    if(!token) {
        return res.status(401).json({
            code: 401,
            message: '未提供认证令牌'
        });
    }
    
    try {
        // 验证JWT token
        const payload = jwt.verify(token, JWT_SECRET);
        
        // 验证用户是否仍然存在
        const [rows] = await promisePool.query(
            'SELECT id, username FROM users WHERE id = ? AND username = ?',
            [payload.userId, payload.username]
        );
        
        if(rows.length === 0) {
            return res.status(401).json({
                code: 401,
                message: '用户不存在或已被删除'
            });
        }
        
        // 将用户信息添加到请求对象
        req.user = {
            id: payload.userId,
            username: payload.username
        };
        
        next();
    } catch (error) {
        console.error('认证错误：', error);
        return res.status(401).json({
            code: 401,
            message: '认证失败',
            error: error.message
        });
    }
}

module.exports = {
    auth
};