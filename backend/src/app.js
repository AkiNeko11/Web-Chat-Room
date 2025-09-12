const express = require('express');
const cors = require('cors');
const path = require('path'); 
const authRoutes = require('./routes/auth.routes');
const roomRoutes = require('./routes/room.routes');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../frontend'))); 
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

// 根路径路由 
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/html/index.html'));
});

module.exports = {
    app
};
