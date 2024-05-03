const User = require('../models/User');
const Note = require('../models/Note');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');

// @desc: Get all users
// @route: GET /users
// @access: Private

const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select('-password').lean();
    if(!users?.length){
        return res.status(400).json({message: 'No users found'});
    }

    res.json(users);
});

// @desc: Create users
// @route: POST /users
// @access: Private

const createUsers = asyncHandler(async (req, res) => {
    const {username, password, roles} = req.body;

    // Confirm data
    if(!username || !password){
        return res.status(400).json({message: 'All fields are required'});
    }

    // Check duplicate
    const duplicate = await User.findOne({username}).collation({locale: 'en', strength: 2}).lean().exec();
    if(duplicate){
        return res.status(409).json({message: 'Duplicate username'});
    }

    // Hash password
    const hashPwd = await bcrypt.hash(password, 10);
    
    const userObject = (!Array.isArray(roles) || !roles.length) ? {username, "password": hashPwd} : {username, "password": hashPwd, roles};

    // Create and store user
    const user = await User.create(userObject);
    if(user){
        res.status(201).json({message: `New user ${username} created.`});
    }
    else{
        res.status(400).json({message: 'Invalid user data received'});
    }
});

// @desc: Update existing users
// @route: PATCH /users
// @access: Private

const updateUsers = asyncHandler(async (req, res) => {
    const {id, username, password, roles, active} = req.body;

    if(!id || !username || !Array.isArray(roles) || !roles.length || typeof active !== 'boolean'){
        return res.status(400).json({message: 'All fields are required'});
    }

    const user = await User.findById(id).exec();
    if(!user){
        return res.status(400).json({message: 'User not found'});
    }

    // Check Duplicates
    const duplicate = await User.findOne({username}).collation({locale: 'en', strength: 2}).lean().exec();
    if(duplicate && duplicate?._id.toString() !== id){
        return res.status(409).json({message: 'Duplicate username'});
    }

    user.username = username;
    user.roles = roles;
    user.active = active;

    if(password){
        user.password = await bcrypt.hash(password, 10);
    }

    const updatedUsers = await user.save();

    res.json({message: `${updatedUsers.username} updated`});

});

// @desc: Delete users
// @route: DELETE /users
// @access: Private

const deleteUsers = asyncHandler(async (req, res) => {
    const {id} = req.body;
    if(!id){
        return res.status(400).json({message: 'User ID Required'});
    }

    const notes = await Note.findOne({ user: id}).lean().exec();
    if(notes){
        return res.status(400).json({message: 'User has assigned notes'});
    }

    const user = await User.findById(id).exec();
    if(!user){
        return res.status(400).json({message: 'User not found'});
    }

    const result = await User.findOneAndDelete({"_id" : id});

    const reply = `Username ${result.username} with ID ${result._id} deleted`

    res.json(reply)
});

module.exports = {
    getAllUsers,
    createUsers,
    updateUsers,
    deleteUsers
};