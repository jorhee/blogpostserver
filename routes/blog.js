const express = require("express");
const blogController = require("../controllers/blog");
const auth = require("../auth");
const { verify, verifyAdmin, isLoggedIn } = auth;

const router = express.Router();



router.post("/addBlog", verify, verifyAdmin, isLoggedIn, blogController.addBlog);

router.get("/getBlogPost", blogController.viewAllBlogPost);

router.get("/getBlog/:blogId", blogController.getBlogById);

router.patch("/addComment/:blogId", verify, isLoggedIn, blogController.addComment);

router.get("/getComments/:blogId", blogController.getComments);

router.delete("/deleteBlog/:blogId", verify, verifyAdmin, isLoggedIn, blogController.deleteBlog);

router.patch("/removeComment/:blogId/:commentId", verify, verifyAdmin, isLoggedIn, blogController.removeComment);






module.exports = router;