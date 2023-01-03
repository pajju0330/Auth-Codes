require('dotenv').config();
const express = require('express');
// const { connect } = require('mongoose');
const connectjs = require('./db/connect');
const mainRouter =  require('./routes/auths')
const app = express();
const port = process.env.PORT;
app.use(express.json());
app.use('/api/v1/auth',mainRouter);
app.use(express.static("static"));
app.get('/',(req,res)=>{
    res.send(`<h1>Hello</h1>`);
})
let start = async(url) => {
    try{
        await connectjs(url);
        app.listen(port,()=> console.log(`app is listening at port ${port}`));
    }
    catch(err){
        console.log(err);
    }

}

start(process.env.MONGO_URI); 