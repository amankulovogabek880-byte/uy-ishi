import fs from "node:fs";
import path from "node:path";

const postsFilePath = path.join(process.cwd(), "src", "models", "posts.json");

function readPosts() {
  if (!fs.existsSync(postsFilePath)) {
    fs.writeFileSync(postsFilePath, "[]");
  }

  const data = fs.readFileSync(postsFilePath, "utf-8");
  return JSON.parse(data || "[]");
}

function writePosts(posts) {
  fs.writeFileSync(postsFilePath, JSON.stringify(posts, null, 2));
}

class PostController {
  createPost = (req, res) => {
    try {
      const { title, description } = req.body;
      const posts = readPosts();

      const newPost = {
        id: posts.length ? posts[posts.length - 1].id + 1 : 1,
        title: title || "",
        description: description || "",
        file: req.file ? `/uploads/${req.file.filename}` : "",
        author: req.user ? `${req.user.first_name} ${req.user.last_name}` : "Unknown",
        createdAt: new Date().toISOString(),
      };

      posts.unshift(newPost);
      writePosts(posts);

      return res.redirect("/?postSuccess=Post created successfully");
    } catch (error) {
      console.error(error);
      return res.redirect("/?postError=Could not create post");
    }
  };

  getDashboard = (req, res) => {
    try {
      const posts = readPosts();
      return res.render("home", {
        title: "Dashboard",
        user: req.user,
        posts,
        postError: req.query.postError,
        postSuccess: req.query.postSuccess,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).send("Internal server error");
    }
  };

  getAllPostsApi = (req, res) => {
    try {
      const posts = readPosts();
      res.json({ success: true, data: posts });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  getOnePostPage = (req, res) => {
    try {
      const posts = readPosts();
      const post = posts.find((item) => item.id === Number(req.params.id));

      if (!post) {
        return res.status(404).send("Post not found");
      }

      return res.render("post-details", {
        title: post.title || "Post details",
        user: req.user,
        post,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).send("Internal server error");
    }
  };
}

export default new PostController();
