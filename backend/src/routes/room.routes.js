const router = require('express').Router();
const { createRoom, getRooms, getRoomByCode } = require('../controllers/room.controller');
const { auth } = require('../middlewares/auth');

// 创建房间 (需要登录)
router.post('/create', auth, createRoom);

// 获取所有房间列表 (需要登录)
router.get('/list', auth, getRooms);

// 根据房间号获取房间信息 (需要登录)
router.get('/:roomCode', auth, getRoomByCode);

module.exports = router;