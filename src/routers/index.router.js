import { Router } from "express";
import upload from "../configs/multer.config.js";
import authController from "../controllers/auth.controller.js";
import postController from "../controllers/post.controller.js";
import authRouter from "./auth.router.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use("/api", authRouter);

router.get("/", requireAuth, postController.getDashboard);

router.get("/login", (req, res) => {
  return res.render("login", {
    title: "Login",
    error: req.query.error,
    success: req.query.success,
    forgotError: req.query.forgotError,
    forgotSuccess: req.query.forgotSuccess,
    showForgot: req.query.forgot === "1",
  });
});

router.get("/register", (req, res) => {
  return res.render("register", {
    title: "Register",
    error: req.query.error,
  });
});

router.get("/reset-password", authController.resetPasswordPage);
router.post("/posts", requireAuth, upload.single("file"), postController.createPost);
router.get("/posts/:id", requireAuth, postController.getOnePostPage);
router.get("/api/posts", requireAuth, postController.getAllPostsApi);

export default router;
