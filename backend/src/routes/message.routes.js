const router = require('express').Router();
const { getMessages } = require('../controllers/message.controller');
const { auth } = require('../middlewares/auth');

// 获取历史消息 (需要登录)
router.post('/getMessages', auth, getMessages);

module.exports = router;