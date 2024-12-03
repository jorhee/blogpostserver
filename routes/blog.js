const express = require("express");
const blogController = require("../controllers/blog");
const auth = require("../auth");
const { verify, verifyAdmin, isLoggedIn } = auth;

const router = express.Router();



router.post("/addBlog", verify, isLoggedIn, blogController.addBlog);

router.get("/getBlogPost", blogController.viewAllBlogPost);

router.get("/getBlog/:blogId", blogController.getBlogById);

router.patch("/editBlog/:blogId", verify, isLoggedIn, blogController.editBlogById);

router.patch("/addComment/:blogId", verify, isLoggedIn, blogController.addComment);


router.get("/getComments/:blogId", blogController.getComments);

router.delete("/deleteBlog/:blogId", verify, isLoggedIn, blogController.deleteBlog);

router.patch("/removeComment/:blogId", verify, isLoggedIn, blogController.removeComment);






module.exports = router;