import path from "node:path";
import { config } from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import { engine } from "express-handlebars";
import router from "./routers/index.router.js";

config({ quiet: true });

const app = express();
const PORT = Number(process.env.PORT || 4000);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET || "cookie_secret"));
app.use("/public", express.static(path.join(process.cwd(), "public")));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.engine(
  "hbs",
  engine({
    extname: ".hbs",
    defaultLayout: "main",
    layoutsDir: path.join(process.cwd(), "src", "views", "layouts"),
  }),
);
app.set("view engine", "hbs");
app.set("views", path.join(process.cwd(), "src", "views"));

app.use(router);

app.all("/{*splat}", (req, res) => {
  res.status(404).send("Page not found");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
