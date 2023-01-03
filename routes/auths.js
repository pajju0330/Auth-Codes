const express = require('express');
const router = express.Router();

const {login,signup,isAuthorized,dashBoard,forgetPassword,resetPassword,protect} = require('../controller/auths');
router.route('/').get(protect,dashBoard)
router.route('/login').post(login);
router.route('/signup').post(signup);
router.route('/dashboard').get(protect,isAuthorized(['user','admin']),dashBoard);

router.route('/forgetpassword').post(forgetPassword);


module.exports = router;