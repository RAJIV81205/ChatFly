const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require( 'bcrypt');


const app = express();
app.use(express.json());
app.use(cors());
dotenv.config();


PORT = process.env.PORT;
URI = process.env.MONGODB_URI;
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
        email: { type: String, required: true, lowercase: true, unique: true },
        password: { type: String, required: true }, 
        time: { type: String },
    });
    
    const User = mongoose.model('User', userSchema);
    
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
            { expiresIn: '1h' }
        );


        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                name: user.username,
                mobile: user.mobile,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`)
})