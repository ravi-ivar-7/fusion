const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");
const app = express();
const socketIO = require("socket.io");
require("dotenv").config();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URL).then(() => {
    console.log('Connected to db.');
}).catch((err) => {
    console.log(err.message);
});

app.get('/ping', (req, res) => {
    return res.status(200).json({ info: 'server is live!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

const server = app.listen(process.env.PORT, () => {
    console.log(`Server started on port: ${process.env.PORT}`);
});

const io = socketIO(server, {
    cors: {
        origin: 'http://localhost:3000',  // Corrected to 'localhost'
        credentials: true,
    }
});

global.onlineUsers = new Map();

io.on('connection', (socket) => {
    global.chatSocket = socket;

    socket.on('add-user', (userId) => {
        onlineUsers.set(userId, socket.id);
    });

    socket.on('send-msg', (data) => {
        console.log(data, 'data of socket');
        const sendUserSocket = onlineUsers.get(data.to);
        if (sendUserSocket) {
            socket.to(sendUserSocket).emit('msg-receive', data.msg);
        }
    });

    socket.on('disconnect', () => {
        onlineUsers.forEach((value, key) => {
            if (value === socket.id) {
                onlineUsers.delete(key);
            }
        });
    });
});
