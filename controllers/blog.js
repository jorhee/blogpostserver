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
        // Extract userId from the authenticated user
        const userId = req.user.id;

        // Fetch user details to validate admin status
        const user = await User.findById(userId);
        if (!user || !user.isAdmin) {
            return res.status(403).json({
                message: 'Access denied. Admin privileges are required.',
            });
        }

        // Extract blog details from the request body
        const { title, content, author, picture } = req.body;

        // Validate required fields
        if (!title || !content || !author) {
            return res.status(400).json({
                message: 'Title, Content, and Author are required.',
            });
        }

        // Initialize picture path (default to null if not provided)
        let picturePath = null;
        if (req.file) {
            // If a picture file is uploaded, save its path
            picturePath = path.join('uploads', req.file.filename);
        }

        // Create a new blog instance
        const newBlog = new Blog({
            title,
            content,
            author,
            picture: picturePath, // Save picture path if available
        });

        // Save the blog post to the database
        const savedBlog = await newBlog.save();

        // Respond with the saved blog post
        res.status(201).json(savedBlog);
    } catch (error) {
        console.error(error); // Log the error for debugging
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



module.exports.addComment = async (req, res) => {
    try {
        // Get the authenticated user's ID
        const userId = req.user.id;

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
            userId,                            // Link the user who made the comment
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



module.exports.getComments = async (req, res) => {
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



module.exports.removeComment = async (req, res) => {
    try {
        // Get the authenticated user's ID
        const userId = req.user.id;

        // Extract blog ID and comment ID from the request parameters
        const { blogId, commentId } = req.params;

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

        // Find the blog post to ensure it exists
        const blog = await Blog.findById(blogId);
        if (!blog) {
            return res.status(404).json({
                message: 'Blog not found.',
            });
        }

        // Find the comment in the blog post by matching the comment's _id
        const comment = blog.comments.find((comment) => comment._id === commentId);
        if (!comment) {
            return res.status(404).json({
                message: 'Comment not found.',
            });
        }

        // Check if the comment belongs to the authenticated user or if the user is an admin
        if (comment.userId.toString() !== userId && !req.user.isAdmin) {
            return res.status(403).json({
                message: 'You are not authorized to delete this comment.',
            });
        }

        // Remove the comment from the blog's comments array
        blog.comments = blog.comments.filter((comment) => comment._id !== commentId);

        // Save the updated blog
        const updatedBlog = await blog.save();

        // Respond with the updated blog after removing the comment
        res.status(200).json({
            message: 'Comment removed successfully.',
            updatedBlog: updatedBlog,
        });
    } catch (error) {
        console.error("Error removing comment:", error);
        res.status(500).json({
            message: 'Error removing comment.',
            error: error.message,
        });
    }
};





module.exports.deleteBlog = async (req, res) => {
    try {
        // Check if the user has admin privileges
        if (!req.user || !req.user.isAdmin) {
            return res.status(403).json({
                message: 'Access denied. Admin privileges are required.',
            });
        }

        // Extract blog ID from the request parameters
        const { blogId } = req.params;

        // Find and delete the blog
        const deletedBlog = await Blog.findByIdAndDelete(blogId);

        // Check if the blog exists
        if (!deletedBlog) {
            return res.status(404).json({
                message: 'Blog not found.',
            });
        }

        // Respond with a success message
        res.status(200).json({
            message: 'Blog deleted successfully.',
        });
    } catch (error) {
        // Log the error and send a server error response
        console.error("Error deleting blog:", error);
        res.status(500).json({
            message: 'Error deleting Blog.',
            error: error.message,
        });
    }
};

