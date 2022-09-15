const catchAsync = require('./../utils/catchAsync');
const User = require('./../models/userModel');
const validator = require('validator');
const appError = require('./../utils/appErrors');
const JWT = require('jsonwebtoken');
const bcrypt = require('bcrypt');

exports.updatePassword = catchAsync(async (req,res,next) => {
    if (!req.body.currentPassword || !req.body.confirmPassword || !req.body.newPassword) {
        return next(new appError(400,'currentPassword , newPassword , confirmPassword are required'));
    }
    const currentPassword = req.body.currentPassword;
    const token = req.headers.authorization.split(' ')[1];

    const validToken = await JWT.verify(token, process.env.JWT_SECRET);

    const foundUser = await User.findOne({'_id':validToken.id}).select('+password');
    if (!foundUser) {
        return next(new appError(400,'user not found'));
    }


    passwordValid = await bcrypt.compare(currentPassword, foundUser.password);

    if (!passwordValid) {
        return next(new appError(400,'password is invalid'));
    }

    if(!validator.equals(req.body.newPassword,req.body.confirmPassword)){
        return next(new appError(400,'confirmPassword , newPassword not matching'));
    }

    const {newPassword,confirmPassword} = req.body;
    const passwordHash = await bcrypt.hash(newPassword, 12);

    await User.findOneAndUpdate({
        _id:  validToken.id
     },{
        'password': passwordHash
     },{
        new: true
     });

     res.status(200).json({
        status: 'success',
        message: 'Password changed successfully'
    });

});

exports.updateUserData = catchAsync(async (req,res,next) => {
    if (req.body.username) {
        if (!validator.isAlphanumeric(req.body.username)) {
            return next(new appError(400,'username is invalid'));
        }
        req.loggedUser.username = req.body.username;
    }
    if (req.body.email) {
        if (!validator.isEmail(req.body.email)) {
            return next(new appError(400,'email is invalid'));
        }
        req.loggedUser.email = req.body.email;
    }
    await req.loggedUser.save();

    res.status(200).json({
        status: 'success',
        message: 'user data updated successfully'
    });
});

exports.deleteUser = catchAsync(async (req,res,next) => {
    await req.loggedUser.delete();
    res.status(204).json({
        status: 'success',
        message: 'user deleted successfully'
    });
});

exports.getAllUsers = (req,res) => {
    res.status(200).json({
        status: 'success',
        data: users
    });
}