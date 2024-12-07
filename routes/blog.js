const express = require("express");
const blogController = require("../controllers/blog");
const auth = require("../auth");
const { verify, verifyAdmin, isLoggedIn } = auth;

const router = express.Router();



router.post("/addBlog", verify, isLoggedIn, blogController.uploadMiddleware, blogController.addBlog);

router.get("/getBlogPost", blogController.viewAllBlogPost);

router.get("/getBlog/:blogId", blogController.getBlogById);

router.put("/editBlog/:blogId", verify, isLoggedIn, blogController.editBlogById);

router.patch("/addComment/:blogId", verify, isLoggedIn, blogController.addComment);


router.get("/getComments/:blogId", blogController.getAllComments);

router.get("/:blogId/:commentId", blogController.getSingleComment);

router.post("/replyComments/:blogId/:commentId", verify, isLoggedIn, blogController.addReplyToComment);

router.delete("/deleteBlog/:blogId", verify, isLoggedIn, blogController.deleteBlog);

router.patch("/removeComment/:blogId/:commentId", verify, isLoggedIn, blogController.removeComment);






module.exports = router;