const Blog = require("../models/Blog");
const {errorHandler} = require("../auth");
const User = require("../models/User");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');


// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Folder where images will be stored
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Ensure unique filenames
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|gif/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif)!'));
    }
  }
});


module.exports.addBlog = async (req, res) => { 
    try {
        // Extract userId and userName from the authenticated user
        const userId = req.user.id;
        const userName = req.user.userName; // Assuming userName is stored in the authenticated user's data

        // Extract blog details from the request body
        const { title, content, picture } = req.body;

        // Validate required fields
        if (!title || !content) {
            return res.status(400).json({
                message: 'Title and Content are required.',
            });
        }

        // Ensure userName and userId are provided
        if (!userName || !userId) {
            return res.status(400).json({
                message: 'User information is missing. Ensure you are authenticated properly.',
            });
        }

        // Initialize picture path (default to null if not provided)
        let picturePath = null;
            
        // Check if a file was uploaded
        if (req.file) {
            // Debugging: Log the uploaded file information
            console.log('Uploaded file:', req.file);
            // Additional debug information
            console.log('Request Body:', req.body);
            console.log('File Path:', req.file.path);
            // If a picture file is uploaded, save its path
            picturePath = path.join('uploads', req.file.filename);
        } else {
            // Debugging: Log if no file is found
            console.log('No file uploaded or req.file is undefined.');
        }

        // Create a new blog instance with the authenticated user's info as the author
        const newBlog = new Blog({
            title,
            content,
            author: {
                userId,      // Reference to the authenticated user's ID
                userName,    // Reference to the authenticated user's name
            },
            picture: picturePath, // Save picture path if available
        });

        // Save the blog post to the database
        const savedBlog = await newBlog.save();

        // Respond with the saved blog post
        res.status(201).json(savedBlog);
    } catch (error) {
        console.error('Error in addBlog controller:', error); // Log the error for debugging
        errorHandler(error, req, res);
    }
};


// Middleware to handle file upload (use this in your route)
module.exports.uploadMiddleware = upload.single('picture');


module.exports.viewAllBlogPost = async (req, res) => {
    try {
        // Fetch all blog posts from the database
        const blogs = await Blog.find({}).sort({ creationDate: -1 }); // Sort by creationDate in descending order (newest first)

        // If no blogs found
        if (blogs.length === 0) {
            return res.status(404).json({
                message: 'No blog posts found.',
            });
        }

        // Return the blogs to the client
        res.status(200).json({
            message: 'Blog posts fetched successfully.',
            blogs: blogs, // Return all blog posts
        });
    } catch (error) {
        console.error(error); // Log the error for debugging
        res.status(500).json({ message: 'An error occurred while fetching blog posts.' });
    }
};


module.exports.getBlogById = async (req, res) => {
    try {
        // Get the blog post ID from the URL parameter
        const { blogId } = req.params;

        // Validate if the ID is a valid MongoDB ObjectId
        if (!mongoose.isValidObjectId(blogId)) {
            return res.status(400).json({
                message: 'Invalid blog post ID format.',
            });
        }
        // Find the blog post by its ID
        const blog = await Blog.findById(blogId);

        // If the blog post does not exist
        if (!blog) {
            return res.status(404).json({
                message: 'Blog post not found.',
            });
        }

        // Return the blog post data
        res.status(200).json({
            message: 'Blog post fetched successfully.',
            blog, // Return the single blog post
        });
    } catch (error) {
        console.error(error); // Log the error for debugging
        res.status(500).json({ message: 'An error occurred while fetching the blog post.' });
    }
};


module.exports.editBlogById = async (req, res) => {

try {
        // Extract user ID from the authenticated user
        const userId = req.user.id;

        // Extract blog ID and new content from the request parameters and body
        const { blogId } = req.params;
        const { title, content, picture } = req.body;

        // Validate the blog ID format
        if (!mongoose.isValidObjectId(blogId)) {
            return res.status(400).json({ message: 'Invalid blog ID format.' });
        }

        // Find the blog by ID
        const blog = await Blog.findById(blogId);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found.' });
        }

        // Check if the user is the author of the blog
        if (blog.author.userId.toString() !== userId) {
            return res.status(403).json({ message: 'You are not authorized to edit this blog.' });
        }

        // Update blog details
        blog.title = title || blog.title; // If title is provided, update it
        blog.content = content || blog.content; // If content is provided, update it
        if (picture) {
            blog.picture = picture; // If a new picture is provided, update it
        }

        // Save the updated blog
        await blog.save();

        // Respond with the updated blog
        res.status(200).json({
            message: 'Blog updated successfully.',
            updatedBlog: blog,
        });
    } catch (error) {
        // Log the error and send a server error response
        console.error("Error editing blog:", error);
        res.status(500).json({
            message: 'Error editing blog.',
            error: error.message,
        });
    }
};

module.exports.addComment = async (req, res) => {
    try {
        // Get the authenticated user's ID
        const userId = req.user.id;
        const userName = req.user.userName;

        // Extract blog ID from the request parameters
        const { blogId } = req.params;

        // Extract comment text from the request body
        const { text } = req.body;

        // Validate comment text
        if (!text) {
            return res.status(400).json({
                message: 'Comment text is required.',
            });
        }

        // Validate blogId format
        if (!mongoose.isValidObjectId(blogId)) {
            return res.status(400).json({
                message: 'Invalid blog ID format.',
            });
        }

        // Find the blog post to ensure it exists
        const blog = await Blog.findById(blogId);
        if (!blog) {
            return res.status(404).json({
                message: 'Blog not found.',
            });
        }

        // Create the comment object, with userId and text
        const comment = {
            _id: new mongoose.Types.ObjectId(), // Generate a new ObjectId for the comment
            userName,                            // Link the user who made the comment
            text,                              // The comment text
        };

        // Add the comment to the blog's comments array
        blog.comments.push(comment);

        // Save the updated blog
        const updatedBlog = await blog.save();

        // Respond with the updated blog and the added comment
        res.status(200).json({
            message: 'Comment added successfully.',
            updatedBlog: updatedBlog,
        });
    } catch (error) {
        // Log the error and send a server error response
        console.error("Error adding comment:", error);
        res.status(500).json({
            message: 'Error adding comment.',
            error: error.message,
        });
    }
};



module.exports.getAllComments = async (req, res) => {
    try {
        // Extract blog ID from the request parameters
        const { blogId } = req.params;

        // Find the blog 
        const blog = await Blog.findById(blogId)

        // Check if the blog exists
        if (!blog) {
            return res.status(404).json({
                message: 'Blog Post not found.',
            });
        }

        // Respond with the comments
        res.status(200).json({
            comments: blog.comments,
        });
    } catch (error) {
        // Log the error and send a server error response
        console.error("Error retrieving comments:", error);
        res.status(500).json({
            message: 'Error retrieving comments.',
            error: error.message,
        });
    }
};


module.exports.getSingleComment = async (req, res) => {

    try {
        const { blogId, commentId } = req.params; // Extract blogId and commentId from request params

        // Find the blog by ID
        const blog = await Blog.findById(blogId);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found.' });
        }

        // Find the comment by ID within the blog's comments array
        const comment = blog.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found.' });
        }

        // Respond with the found comment
        res.status(200).json({
            message: 'Comment retrieved successfully.',
            comment: comment,
        });
    } catch (error) {
        console.error('Error retrieving comment:', error);
        res.status(500).json({
            message: 'An error occurred while retrieving the comment.',
            error: error.message,
        });
    }

}


module.exports.removeComment = async (req, res) => {
    try {
        // Extract user ID from authenticated user
        const userId = req.user.id;
        const userName = req.user.userName;

        // Extract blog ID from request parameters and comment ID from request body
        const { blogId } = req.params;
        const { commentId } = req.params;

        // Validate the blog ID and comment ID format
        if (!mongoose.isValidObjectId(blogId)) {
            return res.status(400).json({ message: 'Invalid blog ID format.' });
        }
        if (!mongoose.isValidObjectId(commentId)) {
            return res.status(400).json({ message: 'Invalid comment ID format.' });
        }

        // Find the blog by ID
        const blog = await Blog.findById(blogId);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found.' });
        }

        // Find the index of the comment
        const commentIndex = blog.comments.findIndex(comment => comment._id.toString() === commentId);
        if (commentIndex === -1) {
            return res.status(404).json({ message: 'Comment not found.' });
        }

        // Get the comment to check ownership
        const comment = blog.comments[commentIndex];

        // Check if user is admin
        const user = await User.findById(userId);
        if (!user) {
            return res.status(403).json({ message: 'User not found.' });
        }

        const isAdmin = user.isAdmin;

        // Allow removal if the user is admin or the owner of the comment
        if (!isAdmin && comment.userName !== userName) {
            return res.status(403).json({ message: 'You are not authorized to remove this comment.' });
        }

        // Remove the comment
        blog.comments.splice(commentIndex, 1);

        // Save the updated blog
        await blog.save();

        // Respond with success
        res.status(200).json({
            message: 'Comment removed successfully.',
            updatedBlog: blog,
        });
    } catch (error) {
        console.error("Error removing comment:", error);
        res.status(500).json({
            message: 'Error removing comment.',
            error: error.message,
        });
    }
};


module.exports.addReplyToComment = async (req, res) => {
    try {
        const userId = req.user.id;
        const userName = req.user.userName;
        const { blogId, commentId } = req.params; // Extract blogId and commentId from request parameters
        const { text } = req.body; // Extract the reply text from the request body

        // Validate that the reply text is provided
        if (!text) {
            return res.status(400).json({ message: 'Reply text is required.' });
        }

        // Validate blogId format
        if (!mongoose.isValidObjectId(blogId)) {
            return res.status(400).json({
                message: 'Invalid blog ID format.',
            });
        }

        // Validate commentId format
        if (!mongoose.isValidObjectId(commentId)) {
            return res.status(400).json({
                message: 'Invalid comment ID format.',
            });
        }
        
        // Find the blog by ID
        const blog = await Blog.findById(blogId);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found.' });
        }

        // Find the comment by ID
        const comment = blog.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found.' });
        }

        // Ensure the replies array exists on the comment
        if (!comment.replies) {
            comment.replies = []; // Initialize replies if it doesn't exist
        }

        // Create a new reply object
        const newReply = {
            userName: userName, // User's name (from authenticated user)
            text: text, // Reply content
        };

        // Push the new reply to the comment's replies array
        comment.replies.push(newReply);

        // Save the updated blog with the new reply
        await blog.save();

        // Respond with a success message and the updated blog
        res.status(200).json({
            message: 'Reply added successfully.',
            blog: blog // Return the updated blog with the new reply
        });

    } catch (error) {
        console.error('Error adding reply to comment:', error);
        res.status(500).json({
            message: 'An error occurred while adding the reply.',
            error: error.message,
        });
    }
};

module.exports.deleteBlog = async (req, res) => {
    try {

        // Extract user ID from authenticated user
        const userId = req.user.id;
        const userName = req.user.userName;

        // Extract blog ID from the request parameters
        const { blogId } = req.params;

        // Validate the blog ID and comment ID format
        if (!mongoose.isValidObjectId(blogId)) {
            return res.status(400).json({ message: 'Invalid blog ID format.' });
        }


        // Find the blog by ID
        const blog = await Blog.findById(blogId);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found.' });
        }

        // Check if the user is admin or the owner of the blog
        const isAdmin = req.user.isAdmin;


        // If the user is not an admin, they can only delete their own blog
        if (!isAdmin && blog.author.userId.toString() !== userId) {
            return res.status(403).json({ message: 'You are not authorized to delete this blog.' });
        }

        // Remove the blog
        await Blog.findByIdAndDelete(blogId);

        // Respond with a success message
        res.status(200).json({
            message: 'Blog deleted successfully.',
        });
    } catch (error) {
        // Log the error and send a server error response
        console.error("Error deleting blog:", error);
        res.status(500).json({
            message: 'Error deleting blog.',
            error: error.message,
        });
    }
};

module.exports.likeBlog = async (req, res) => {

    try {

    const { blogId } = req.params;
    const userId = req.user.id; 


    if (!userId ) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Initialize likes as an empty array if it's null (for older records)
    if (!blog.likes) {
      blog.likes = [];
    }

    // Check if the user has already liked the post
    if (blog.likes.includes(userId)) {
      return res.status(400).json({ message: 'You already liked this post' });
    }

    // Add user to the likes array
    blog.likes.push(userId);
    await blog.save();

    res.json({ updatedBlog: blog });
  } catch (err) {
    res.status(500).json({ message: 'An error occurred', error: err.message });
  }

};