import pool from "../configs/db.config.js";

export const requireAuth = async (req, res, next) => {
  try {
    const { userId } = req.signedCookies;

    if (!userId) {
      return res.redirect("/login");
    }

    const { rows } = await pool.query(
      "SELECT id, first_name, last_name, email FROM users WHERE id = $1",
      [userId],
    );

    if (!rows.length) {
      res.clearCookie("userId");
      return res.redirect("/login");
    }

    req.user = rows[0];
    next();
  } catch (error) {
    console.error(error);
    return res.redirect("/login?error=Please login again");
  }
};
