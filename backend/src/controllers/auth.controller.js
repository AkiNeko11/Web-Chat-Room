const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const {JWT_SECRET} = require('../config/env');
const promisePool = require('../config/database');

function signToken(username, userId) {
    return jwt.sign({username, userId}, JWT_SECRET, {expiresIn: '24h'}); 
}

async function register(req, res) {
    try {
        const {username, password} = req.body;
        if(!username || !password) {
            return res.status(400).json({
                code: 400,
                message: '用户名和密码不能为空'
            });
        }

        // 检查用户名是否已存在
        const [rows] = await promisePool.query('SELECT * FROM users WHERE username = ?', [username]);
        if(rows.length > 0) {
            return res.status(400).json({
                code: 400,
                message: '用户名已存在'
            });
        }

        // hash密码存储
        const hashedPassword = await bcrypt.hash(password, 10);
        const [insertResult] = await promisePool.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
        const userId = insertResult.insertId;
        console.log('注册成功',username);   
        return res.status(201).json({
            code: 201,
            message: '注册成功',
            token: signToken(username,userId)
        });

    } catch (error) {
        console.error('注册失败',error);
        res.status(500).json({message: '服务器错误'});
    }
}

async function login(req, res) {
    try {
        const {username, password} = req.body;
        if(!username || !password) {
            return res.status(400).json({
                code: 400,
                message: '用户名和密码不能为空'
            });
        }

        // 检查用户名是否已存在
        const [rows] = await promisePool.query('SELECT * FROM users WHERE username = ?', [username]);
        if(rows.length === 0) {
            return res.status(400).json({
                code: 400,
                message: '用户名不存在'
            });
        }

        // 检查密码是否正确
        const user = rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if(!isPasswordValid) {
            return res.status(400).json({
                code: 400,
                message: '密码错误'
            });
        }
        console.log('登录成功',username);

        const userId = user.id;
        return res.status(200).json({
            code: 200,
            message: '登录成功',
            token: signToken(username,userId),
        });
    } catch (error) {
        console.error('登录失败',error);
        res.status(500).json({message: '服务器错误'});
    }
}

module.exports = {
    register,
    login
};
