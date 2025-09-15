const promisePool = require('../config/database');

// 获取房间历史消息

async function getMessages(req, res) {
    try {
        const { roomCode } = req.body;
        const currentUserId = req.user.id; // 从JWT token中获取当前用户ID
        
        // 先查询房间是否存在
        const [roomResult] = await promisePool.query(
            'SELECT id FROM rooms WHERE room_code = ? AND is_active = true',
            [roomCode]
        );
        
        if (roomResult.length === 0) {
            return res.status(404).json({
                code: 404,
                message: '房间不存在'
            });
        }
        
        const roomId = roomResult[0].id;
        
        // 查询历史消息（按时间正序，最多50条）
        const [rows] = await promisePool.query(`
            SELECT m.message, m.created_at, u.username, m.user_id 
            FROM messages m 
            JOIN users u ON m.user_id = u.id 
            WHERE m.room_id = ? 
            ORDER BY m.created_at ASC 
            LIMIT 50
        `, [roomId]);
        
        console.log(`获取房间 ${roomCode} 历史消息成功，共 ${rows.length} 条`);  
        
        return res.status(200).json({
            code: 200,
            message: '获取房间历史消息成功',
            data: rows.map(row => ({
                username: row.username,
                message: row.message,
                timestamp: row.created_at,
                isCurrentUser: row.user_id === currentUserId
            })),
            count: rows.length,
            roomCode: roomCode
        });
    } catch (error) {
        console.error('获取房间历史消息错误:', error);
        return res.status(500).json({
            code: 500,
            message: '服务器内部错误'
        });
    }
}

module.exports = {
    getMessages
};