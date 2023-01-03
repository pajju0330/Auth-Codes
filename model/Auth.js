const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken')
let AuthSchema = new mongoose.Schema({
    username:{
        type:String,
        required:[true,'Please enter a username'],
    },
    email:{
        type:String,
        required:[true,'Please enter the email'],
        validate: [validator.isEmail,'Please provide a proper email']
    },
    password:{
        type:String,
        required:[true,'Please enter a password'],
        minLength: 8,
        select:false
    },
    confirmPassword:{
        type:String,
        required:[true,'Please enter a password'],
        minLength: 8,
        validate:{
            validator: function(e){
                return e === this.password;
            },
            message: "Password are not the same"
        }
    },
    role:{
        type: String,
        enum: [ 'admin','user','member','maintainer' ],
        default:'user'
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    passswordChangedAt: Date,
});

AuthSchema.pre('save' , async function(next){
    if(!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password,10);
    this.confirmPassword = undefined;
    next();

})
AuthSchema.methods.passwordCheck = async function(candPass,userPass){
    return await bcrypt.compare(candPass,userPass)
};
AuthSchema.methods.createPasswordResetToken = async function(){
    const resetToken = await crypto.randomBytes(32).toString("hex");
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest("hex");
    this.passwordResetExpires = Date.now() + (10*60*1000);
    console.log(resetToken, this.passwordResetToken);
    return resetToken;
};


AuthSchema.methods.changePasswordAfter = async function(JWTTimeStamp){
    if(this.passswordChangedAt){
        const passswordChangeTimeStamp = parseInt(this.passswordChangedAt.getTime()/1000,10);
        return JWTTimeStamp < passswordChangeTimeStamp;
    }
    return false;
}

module.exports = mongoose.model("Auth" ,  AuthSchema);