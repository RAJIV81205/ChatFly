const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');
const CryptoJS = require('crypto-js');
const bodyParser = require('body-parser');
const webPush = require('web-push');






const app = express();

const http = require('http');
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
app.use(bodyParser.json());
app.use(express.static(path.join("public")));


const PORT = process.env.PORT || 5000;
const URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const secretKey = process.env.secretKey;



mongoose.connect(URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('Error connecting to MongoDB:', err));


const userSchema = new mongoose.Schema({
    username: { type: String, required: true, trim: true },
    mobile: { type: String, default: '' },
    displayName: { type: String, required: true, unique: true },
    gender: { type: String },
    email: { type: String, required: true, lowercase: true, unique: true },
    password: { type: String, required: true },
    time: { type: String },
});

const User = mongoose.model('User', userSchema);


const MessageSchema = new mongoose.Schema({
    sender: { type: String, required: true },
    senderId: { type: String, required: true },
    receiverId: { type: String, required: true },
    text: { type: String, required: true },
    time: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
});

const History = mongoose.model('Message', MessageSchema);




app.post('/signup', async (req, res) => {
    try {
        const { username, displayName, gender, mobile, email, password, time } = req.body;

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
                displayName: user.displayName
            },
        });
    } catch (error) {
        console.error("Login error:", error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});





app.post('/verify', async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ message: 'Token is required' });
    }


    try {
        const result = jwt.verify(token, JWT_SECRET); // Verify the token

        const user = await User.findById(result.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            message: 'Token verified successfully',
            result,
        });
    } catch (error) {
        console.error("Error during token verification:", error.message);
        res.status(401).json({
            message: 'Invalid or expired token',
            error: error.message,
        });
    }
});




const activeUsers = {};

io.on('connection', (socket) => {
    socket.on('user-join', (token) => {
        const isTokenPresent = Object.values(activeUsers).includes(token);

        if (!isTokenPresent) {
            activeUsers[socket.id] = token;
            io.emit('update-users', Object.values(activeUsers));
        }
        else {
            io.emit('update-users', Object.values(activeUsers))
        }
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

    const encryptedMessage = encrypt(messageData.text);

    try {
        const newMessage = new History({
            sender: messageData.sender,
            senderId: messageData.stoken,
            receiverId: messageData.rtoken,
            text: encryptedMessage,
            time: messageData.time,
        });
        await newMessage.save();
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


        const decryptedMessages = messages.map((message) => ({
            sender: message.sender,
            senderId: message.senderId,
            receiverId: message.receiverId,
            text: decrypt(message.text),
            time: message.time,
        }));

        res.json({ messages: decryptedMessages });
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


function encrypt(text) {
    return CryptoJS.AES.encrypt(text, secretKey).toString();
}

function decrypt(cipherText) {
    const bytes = CryptoJS.AES.decrypt(cipherText, secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
}


app.post('/load-profile', async (req, res) => {
    try {
        const { userid } = req.body;
        const user = await User.findById(userid);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        else{
            return res.status(200).json({user})
        }

    } catch (error) {

    }
})



app.post('/updateProfile', async (req, res) => {
    const { id, username, mobile,  email, time } = req.body;

    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.username = username;
        user.mobile = mobile;
        user.email = email;
        user.time = time;

        await user.save();
        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});





const vapidKeys = {
    publicKey: 'BM3jfuIBk3oUnjNKUpLjEAfr_VvFpQ4jX6UmWdTZDox37Tt4nYHTaEOIkq0PfAl5Rf6HeerZ59DXjmH0jPQpwuw',
    privateKey: 'NQRr__pZlg0vsN8DMOODuCu4Bz5t4SOA9d5kGNJ7wYo',
};

webPush.setVapidDetails(
    'mailto:lucky81205@gmail.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

let subscriptions = [];


app.post('/subscribe', (req, res) => {
    const subscription = req.body;
    subscriptions.push(subscription);
    res.status(201).json({ message: 'Subscription saved.' });
});


app.post('/send-notification', (req, res) => {
    const { title, body } = req.body;

    const payload = JSON.stringify({
        title,
        body,
        icon: '/img/boy.png',
    });

    subscriptions.forEach((subscription) => {
        webPush
            .sendNotification(subscription, payload)
            .then(() => console.log('Notification sent.'))
            .catch((error) => console.error('Error sending notification:', error));
    });

    res.status(200).json({ message: 'Notifications sent.' });
});


app.listen(PORT ,()=>{
    console.log(`Server is running on port ${PORT}`)
})
