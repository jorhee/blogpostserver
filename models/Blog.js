const mongoose = require('mongoose');

// Define the Reply Schema for nested replies in comments
const replySchema = new mongoose.Schema({
    userName: {
        type: String,
        required: [true, 'UserName is required']
    },
    text: {
        type: String,
        required: [true, 'Reply text is required']
    },
    creationDate: {
        type: Date,
        default: Date.now
    }
}, { _id: false }); // Set _id to false because replies don’t need a unique _id

// Define the Comment Schema, now including replies
const commentSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId, // Unique identifier for each comment
    userName: {
        type: String,
        required: [true, 'UserName is required']
    },
    text: {
        type: String,
        required: [true, 'Comment text is required']
    },
    creationDate: {
        type: Date,
        default: Date.now
    },
    replies: [replySchema]  // An array of replies for this comment
});

// Define the Blog Schema that includes comments
const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is Required'],
    },
    content: {
        type: String,
        required: [true, 'Content is Required'],
    },
    author: {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        userName: {
            type: String,
            required: [true, 'Author user name is required'],
        },
        profilePicture: {
            type: String, // A single string to store the path or filename of the image
            default: null,
        },
    },
    picture: {
        type: String, // A single string to store the path or filename of the image
        default: null,
    },
    creationDate: {
        type: Date,
        default: Date.now, // Automatically set the creation date to the current date/time
    },
    comments: [commentSchema], // Array of comment objects, now with replies
});

module.exports = mongoose.model('Blog', blogSchema);
