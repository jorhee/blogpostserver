const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId, // Unique identifier for each comment
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: [true, 'User ID is required']
    },
    text: {
        type: String,
        required: [true, 'Comment text is required']
    },
    creationDate: {
        type: Date,
        default: Date.now
    }
});

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is Required']
    },
    content: {
        type: String,
        required: [true, 'Content is Required']
    },
    author: {
        type: String,
        required: [true, 'Author is Required']
    },
    picture: {
    type: String, // A single string to store the path or filename of the image
    default: null
    },
    creationDate: {
        type: Date,
        default: Date.now, // Automatically set the creation date to the current date/time
    },
    comments: [commentSchema] // Array of comment objects
});

module.exports = mongoose.model('Blog', blogSchema);
