const {promisify} = require('util');
const Auth = require('../model/Auth');
const jwt = require('jsonwebtoken');
const CustomError = require('../errors');
const sendEmail = require('../middleware/email')
const createToken = id =>{
    let token = jwt.sign({id},process.env.JWT_SECRET,{
        expiresIn: process.env.EXPIRES_IN
    });
    return token;
}
const SendToken = (user,statusCode, res)=>{
    const token = createToken(user._id);
    let cookieOptions = {  
        expires: new Date(Date.now() + 400*24*60*60),
        httpOnly: true
     }
    res.cookie('token',token,cookieOptions);
    res.status(statusCode).json({
        status: 'Success',
        token,
        data:{
            user
        }

    });
}
let login = async(req,res)=>{
    const {email,password} = req.body;
    if(!email || !password){
        return res.status(400).send('Missing email or password')
    }
    const user = await Auth.findOne({email}).select('+password');
    const verification = await user.passwordCheck(password,user.password);
    if(!user || !verification){
        return res.status(401).send('Incorrect email or password')
    }
    SendToken(user,201,res);
}
let signup = async(req,res,next)=>{
    const {username,email,password,confirmPassword} = req.body;
    let user = await Auth.create( {username,email,password,confirmPassword} );
    const token = createToken(user._id); 
    SendToken(user,201,res);
}
let isAuthorized = (...roles) => {
    return (req,res,next) => {
        if(!roles.includes(req.body.role)) return next(new CustomError.UnauthorizedError('Not Authorized'));
        next();
    }
}

let forgetPassword = async(req,res) =>{
    const user = await Auth.findOne({email:req.body.email});
    if(!user) res.status(400).send('No user with this email');
    
    const resetToken = await user.createPasswordResetToken();
    await user.save({validateBeforeSave: false});
    const resetURL = `${req.protocol}://${req.get("host")}/api/v1/auth/${resetToken}`;
    const message = `Your password reset token is ${resetURL}. \n If you didn't sent this reset password request, please ignore. `;
    console.log(message);
    try{
        await sendEmail({
            email: user.email,
            subject: `password reset token (expires in 10 mins)`,
            message:message
        });
        res.status(200).json({
            status:"success",
            message: "Email sent"
        });
    }

    catch(err){
        user.passwordResetToken = undefined,
        user.passwordResetExpires = undefined
        await user.save({validateBeforeSave: false});
        res.status(500).send('Password reset fail');
    }
}
const resetPassword = async(req,res) =>{
    
}
const protect = async(req,res,next) =>{
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(' ')[1];
    }
    if(!token){
        return next(
            new CustomError.UnauthenticatedError('You are not logged in')
        );
    }
    const decoded = await promisify(jwt.verify)(token,process.env.JWT_SECRET);
    const freshUser = await Auth.findById(decoded.id);
    if(!freshUser){
        return next(
            new CustomError.NotFoundError('User not found')
        );
    }

    next();
}
let dashBoard = (req,res) =>{
    res.send('Welcome my admin sir');
}
module.exports = {login,signup,isAuthorized,dashBoard,forgetPassword,resetPassword,protect};