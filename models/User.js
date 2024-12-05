//Activity
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    
    email: {
        type: String,
        required: [true, 'Email is Required']
    },
    userName: {
            type: String,
            required: [true, 'Author first name is required'],
        },
    profilePicture: {
        type: String, // A single string to store the path or filename of the image
        default: null,
    },
    password: {
        type: String,
        required: [true, 'Password is Required']
    },
    isAdmin: {
        type: Boolean,
        default: false
    }
});


module.exports = mongoose.model('User', userSchema);