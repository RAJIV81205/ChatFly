const express = require ('express');
const mongoose = require ('mongoose');
const cors = require ('cors');
const path = require ('path');
PORT = 3000


const app = express();
app.use(cors);

app.use(express.static(path.join(__dirname, 'public')))






app.listen(PORT,()=>{
    console.log(`server is running on port ${PORT}`)
})