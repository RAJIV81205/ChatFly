const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');



const app = express();

const http = require('http');
const { type } = require('os');
const server = http.createServer(app);



const io = require('socket.io')(server, {
    cors: {
        origin: ["http://127.0.0.1:5500", "https://chatfly.onrender.com"],
        methods: ["GET", "POST"]
    }
});


dotenv.config();

app.use(express.json());
app.use(cors());
app.use(express.static(path.join("public")));


const PORT = process.env.PORT || 5000;
const URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;



mongoose.connect(URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('Error connecting to MongoDB:', err));


const userSchema = new mongoose.Schema({
    username: { type: String, required: true, trim: true },
    mobile: { type: String, default: '' },
    displayName : { type: String, required:true , unique:true},
    gender:{type:String},
    email: { type: String, required: true, lowercase: true, unique: true },
    password: { type: String, required: true },
    time: { type: String },
});

const User = mongoose.model('User', userSchema);





app.post('/signup', async (req, res) => {
    try {
        const { username,displayName, gender, mobile, email, password, time } = req.body;

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
            displayName,
            gender,
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


const MessageSchema = new mongoose.Schema({
    sender: { type: String, required: true }, // Sender's name
    senderId: { type: String, required: true }, // Sender's unique ID
    receiverId: { type: String, required: true }, // Receiver's unique ID
    text: { type: String, required: true }, // Message text
    time: { type: String, required: true }, // Human-readable time
    timestamp: { type: Date, default: Date.now }, // Timestamp for sorting
});

const History = mongoose.model('Message', MessageSchema);

const activeUsers = {};

io.on('connection', (socket) => {
    socket.on('user-join', (token) => {
        activeUsers[socket.id] = token;
        io.emit('update-users', Object.values(activeUsers));
    });

    socket.on('send-message', async (messageData) => {
        try {
            await saveMessages(messageData);
            io.emit('receive-message', messageData);
        } catch (error) {
            console.error(error);
        }
    });

    socket.on('check-status', () => {
        io.emit('update-users', Object.values(activeUsers));
    });

    socket.on('disconnect', () => {
        const token = activeUsers[socket.id];
        if (token) {
            delete activeUsers[socket.id];
            io.emit('update-users', Object.values(activeUsers));
        }
    });

    
});




async function saveMessages(messageData) {
    try {
        const newMessage = new History({
            sender: messageData.sender,
            senderId: messageData.stoken,
            receiverId: messageData.rtoken,
            text: messageData.text,
            time: messageData.time,
        });
        await newMessage.save();
        console.log('Message saved:', newMessage);
    } catch (error) {
        console.error('Error saving message to database:', error);
    }
}


app.post('/load-history', async (req, res) => {
    try {
        const { user1, user2 } = req.body;
        const messages = await History.find({
            $or: [
                { senderId: user1, receiverId: user2 },
                { senderId: user2, receiverId: user1 },
            ],
        }).sort({ timestamp: 1 });
        res.json({ messages });
    } catch (error) {
        console.error('Error loading chat history:', error);
        res.status(500).json({ error: 'Failed to load chat history' });
    }
});




app.get('/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});


server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})
