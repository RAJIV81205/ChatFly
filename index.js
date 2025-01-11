const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');


const app = express();


dotenv.config();

app.use(express.json());
app.use(cors());
app.use(express.static(path.join("public")));

// Environment variables
const PORT = process.env.PORT || 5000;
const URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;

// MongoDB connection
mongoose.connect(URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('Error connecting to MongoDB:', err));

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, trim: true },
    mobile: { type: String, default: '' },
    email: { type: String, required: true, lowercase: true, unique: true },
    password: { type: String, required: true },
    time: { type: String },
});

const User = mongoose.model('User', userSchema);

// Signup API
app.post('/signup', async (req, res) => {
    try {
        const { username, mobile, email, password, time } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Username, email, and password are required' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            username,
            mobile: mobile || '',
            email,
            password: hashedPassword,
            time: time || new Date().toLocaleString(),
        });

        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error("Signup error:", error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Login API
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { id: user._id },
            JWT_SECRET,
            { expiresIn: '30 days' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                name: user.username,
                mobile: user.mobile,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("Login error:", error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Token Verification API
app.post('/verify', (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ message: 'Token is required' });
    }

    try {
        const result = jwt.verify(token, JWT_SECRET);
        res.status(200).json({
            message: 'Token verified successfully',
            result,
        });
    } catch (error) {
        res.status(401).json({
            message: 'Invalid or expired token',
            error: error.message,
        });
    }
});

const chatMessages = []; // Temporary storage for messages (No DB usage)

// Socket.io setup
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');


const io = require('socket.io')(server, {
    cors: {
        origin: ["http://127.0.0.1:5500" ,"https://chatfly.onrender.com"] , // Replace with your frontend's URL
        methods: ["GET", "POST"]
    }
});

// Handle socket connection
io.on('connection', (socket) => {
    console.log('A user connected');


    // Receive and broadcast messages
    socket.on('send-message', (messageData) => {
        chatMessages.push(messageData); // Store message temporarily
        io.emit('receive-message', messageData); // Broadcast to all users
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

// Start server with Socket.io
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
