const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const roomRoutes = require('./routes/room.routes');
const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes); 

module.exports = {
    app
};
