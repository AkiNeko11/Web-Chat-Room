const promisePool = require('./config/database');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./config/env');

// 存储在线用户信息
const onlineUsers = new Map(); // socketId -> {userId, username, roomCode}

// 验证Socket.io连接的用户身份
function authenticateSocket(socket, next) {
    const token = socket.handshake.auth.token;
    
    if (!token) {
        return next(new Error('未提供认证令牌'));
    }
    
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        socket.userId = payload.userId;
        socket.username = payload.username;
        next();
    } catch (error) {
        next(new Error('认证失败'));
    }
}

// 处理Socket.io连接
function handleConnection(io, socket) {
    console.log(`用户连接: ${socket.username} (${socket.id})`);
    
    // 存储用户信息
    onlineUsers.set(socket.id, {
        userId: socket.userId,
        username: socket.username,
        roomCode: null
    });
    
    // 监听加入房间事件
    socket.on('join_room', async (data) => {
        try {
            const { roomCode } = data;
            
            // 验证房间是否存在
            const [rows] = await promisePool.query(
                'SELECT * FROM rooms WHERE room_code = ? AND is_active = true',
                [roomCode]
            );
            
            if (rows.length === 0) {
                socket.emit('error', { message: '房间不存在' });
                return;
            }
            
            // 离开之前的房间
            if (socket.roomCode) {
                // 向旧房间发送离开消息
                socket.to(socket.roomCode).emit('user_left', {
                    username: socket.username,
                    message: `${socket.username} 离开了房间`
                });
                socket.leave(socket.roomCode);
                console.log(`${socket.username} 离开房间: ${socket.roomCode}`);
            }
            
            // 加入新房间
            socket.join(roomCode);
            socket.roomCode = roomCode;
            
            // 更新用户信息
            onlineUsers.set(socket.id, {
                ...onlineUsers.get(socket.id),
                roomCode: roomCode
            });
            
            // 通知房间内其他用户
            socket.to(roomCode).emit('user_joined', {
                username: socket.username,
                message: `${socket.username} 加入了房间`
            });
            
            // 发送房间信息给当前用户
            socket.emit('room_joined', {
                roomCode: roomCode,
                roomName: rows[0].room_name,
                message: `欢迎加入房间 ${rows[0].room_name}`
            });
            
            console.log(`${socket.username} 加入房间: ${roomCode}`);
            
        } catch (error) {
            console.error('加入房间错误:', error);
            socket.emit('error', { message: '加入房间失败' });
        }
    });
    
    // 监听发送消息事件
    socket.on('send_message', async (data) => {
        try {
            const { message } = data;
            
            if (!socket.roomCode) {
                socket.emit('error', { message: '请先加入房间' });
                return;
            }
            
            if (!message || message.trim() === '') {
                socket.emit('error', { message: '消息不能为空' });
                return;
            }
            
            // 保存消息到数据库
            const [roomResult] = await promisePool.query(
                'SELECT id FROM rooms WHERE room_code = ? AND is_active = true',
                [socket.roomCode]
            );
            
            if (roomResult.length === 0) {
                socket.emit('error', { message: '房间不存在' });
                return;
            }
            
            const roomId = roomResult[0].id;
            
            const [result] = await promisePool.query(
                'INSERT INTO messages (room_id, user_id, message) VALUES (?, ?, ?)',
                [roomId, socket.userId, message.trim()]
            );
            
            // 广播消息给房间内所有用户
            io.to(socket.roomCode).emit('new_message', {
                messageId: result.insertId,
                username: socket.username,
                message: message.trim(),
                timestamp: new Date().toISOString()
            });
            
            console.log(`${socket.username} 在房间 ${socket.roomCode} 发送消息: ${message}`);
            
        } catch (error) {
            console.error('发送消息错误:', error);
            socket.emit('error', { message: '发送消息失败' });
        }
    });
    
    // 监听离开房间事件
    socket.on('leave_room', () => {
        if (socket.roomCode) {
            socket.to(socket.roomCode).emit('user_left', {
                username: socket.username,
                message: `${socket.username} 离开了房间`
            });
            
            socket.leave(socket.roomCode);
            console.log(`${socket.username} 离开房间: ${socket.roomCode}`);
            socket.roomCode = null;
        }
    });
    
    // 监听断开连接
    socket.on('disconnect', () => {
        if (socket.roomCode) {
            socket.to(socket.roomCode).emit('user_left', {
                username: socket.username,
                message: `${socket.username} 离开了房间`
            });
        }
        
        onlineUsers.delete(socket.id);
        console.log(`用户断开连接: ${socket.username} (${socket.id})`);
    });
}

module.exports = {
    authenticateSocket,
    handleConnection
};