const promisePool = require('../config/database');
const {v4: uuidv4} = require('uuid');

// 创建房间
async function createRoom(req, res) {
    try {
        const {roomName} = req.body;
        const userId = req.user.id;
        
        if(!roomName) {
            return res.status(400).json({
                code: 400,
                message: '房间名不能为空'
            });
        }

        const roomCode="ROOM-"+uuidv4().substring(0, 8).toUpperCase();

        const [insertResult] = await promisePool.query('INSERT INTO rooms (room_name, room_code, created_by) VALUES (?, ?, ?)', [roomName, roomCode, userId]);

        console.log('创建房间',roomName,roomCode,userId);

        return res.status(201).json({
            code: 201,
            message: '房间创建成功',
            data: {
                roomId: insertResult.insertId,
                roomName: roomName,
                roomCode: roomCode
            }
        });
    } catch (error) {
        console.error('创建房间失败',error);
        res.status(500).json({message: 'Internal server error'});
    }
}

// 获取所有房间列表
async function getRooms(req, res) {
    try {
        const [rows] = await promisePool.query(`
            SELECT r.*, u.username as creator_name 
            FROM rooms r 
            JOIN users u ON r.created_by = u.id 
            WHERE r.is_active = true 
            ORDER BY r.created_at DESC
        `);
        console.log('获取房间列表成功');
        return res.status(200).json({
            code: 200,
            message: '获取房间列表成功',
            data: rows
        });

    } catch (error) {
        console.error('获取房间列表错误：', error);
        return res.status(500).json({
            code: 500,
            message: '服务器内部错误'
        });
    }
}

// 根据房间号获取房间信息
async function getRoomByCode(req, res) {
    try {
        const { roomCode } = req.params;
        
        const [rows] = await promisePool.query(
            'SELECT * FROM rooms WHERE room_code = ? AND is_active = true',
            [roomCode]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                code: 404,
                message: '房间不存在或已经关闭'
            });
        }

        return res.status(200).json({
            code: 200,
            message: '获取房间信息成功',
            data: rows[0]
        });

    } catch (error) {
        console.error('获取房间信息错误：', error);
        return res.status(500).json({
            code: 500,
            message: '服务器内部错误'
        });
    }
}

module.exports = {
    createRoom,
    getRooms,
    getRoomByCode
};