const { app } = require('./app');
const { PORT } = require('./config/env');
const http = require('http');
const { Server } = require('socket.io');
const { authenticateSocket, handleConnection } = require('./socketHandlers');

// 创建HTTP服务器
const server = http.createServer(app);

// 创建Socket.io实例
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// 添加认证中间件
io.use(authenticateSocket);

// 监听连接事件
io.on('connection', (socket) => {
    handleConnection(io, socket);
});

// 启动服务器
server.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`Socket.io 已启动`);
});