const express = require ('express');
const mongoose = require ('mongoose');
const cors = require ('cors');
const dotenv = require ('dotenv');
const nodemon = require ('nodemon');


const app = express();
app.use(cors);
dotenv.config();
PORT = process.env.PORT;
URI = process.env.MONGODB_URI;



mongoose.connect(URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('Error connecting to MongoDB:', err));




app.listen(PORT,()=>{
    console.log(`server is running on port ${PORT}`)
})