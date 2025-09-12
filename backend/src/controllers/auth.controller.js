const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const {JWT_SECRET} = require('../config/env');
const promisePool = require('../config/database');

function signToken(username) {
    return jwt.sign({username}, JWT_SECRET, {expiresIn: '0.5h'});
}

async function register(req, res) {
    try {
        const {username, password} = req.body;
        if(!username || !password) {
            return res.status(400).json({
                code: 400,
                message: 'Username and password are required'
            });
        }

        // 检查用户名是否已存在
        const [rows] = await promisePool.query('SELECT * FROM users WHERE username = ?', [username]);
        if(rows.length > 0) {
            return res.status(400).json({
                code: 400,
                message: 'Username already exists'
            });
        }

        // hash密码存储
        const hashedPassword = await bcrypt.hash(password, 10);
        await promisePool.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
        console.log('注册成功',username);   
        return res.status(201).json({
            code: 201,
            message: 'User registered successfully',
            token: signToken(username)
        });

    } catch (error) {
        res.status(500).json({message: 'Internal server error'});
    }
}

async function login(req, res) {
    try {
        const {username, password} = req.body;
        if(!username || !password) {
            return res.status(400).json({
                code: 400,
                message: 'Username and password are required'
            });
        }

        // 检查用户名是否已存在
        const [rows] = await promisePool.query('SELECT * FROM users WHERE username = ?', [username]);
        if(rows.length === 0) {
            return res.status(400).json({
                code: 400,
                message: 'Username not found'
            });
        }

        // 检查密码是否正确
        const user = rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if(!isPasswordValid) {
            return res.status(400).json({
                code: 400,
                message: 'Invalid password'
            });
        }
        console.log('登录成功',username);
        return res.status(200).json({
            code: 200,
            message: 'Login successful',
            token: signToken(username)
        });
    } catch (error) {
        res.status(500).json({message: 'Internal server error'});
    }
}

module.exports = {
    register,
    login
};
