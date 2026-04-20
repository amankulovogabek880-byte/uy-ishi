import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../configs/db.config.js";
import transporter from "../configs/mail.config.js";

class AuthController {
  login = async (req, res) => {
    try {
      const { email, password } = req.body || {};

      if (!email || !password) {
        return res.redirect("/login?error=Email and password are required");
      }

      const existing = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

      if (!existing.rowCount) {
        return res.redirect("/login?error=User not found");
      }

      const user = existing.rows[0];
      const matched = await bcrypt.compare(password, user.password);

      if (!matched) {
        return res.redirect("/login?error=Password mismatch");
      }

      res.cookie("userId", user.id, {
        signed: true,
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24,
      });

      return res.redirect("/");
    } catch (error) {
      console.error(error);
      return res.redirect("/login?error=Login failed");
    }
  };

  register = async (req, res) => {
    try {
      const { firstName, lastName, email, password } = req.body || {};

      if (!firstName || !lastName || !email || !password) {
        return res.redirect("/register?error=All fields are required");
      }

      const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
      if (existing.rowCount) {
        return res.redirect("/register?error=User already exists");
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const { rows } = await pool.query(
        `INSERT INTO users (first_name, last_name, email, password)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [firstName, lastName, email, hashedPassword],
      );

      res.cookie("userId", rows[0].id, {
        signed: true,
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24,
      });

      return res.redirect("/");
    } catch (error) {
      console.error(error);
      return res.redirect("/register?error=Register failed");
    }
  };

  sendSms = async (req, res) => {
  const { mobile } = req.body;

  // const response = await this.#_smsService.sendSms({ mobile });

  res.send(response);
  };

  forgotPassword = async (req, res) => {
    try {
      const { email } = req.body || {};

      if (!email) {
        return res.redirect("/login?forgot=1&forgotError=Email is required");
      }

      const existing = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

      if (!existing.rowCount) {
        return res.redirect("/login?forgot=1&forgotError=User not found");
      }

      const user = existing.rows[0];
      const secret = `${process.env.RESET_PASSWORD_SECRET}${user.password}`;

      const token = jwt.sign({ userId: user.id, email: user.email }, secret, {
        expiresIn: "15m",
      });

      const resetLink = `${process.env.APP_URL}/reset-password?token=${token}&id=${user.id}`;

      await transporter.sendMail({
        from: process.env.MAIL_USER,
        to: user.email,
        subject: "Reset your password",
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
            <h2>Password reset</h2>
            <p>Hello ${user.first_name},</p>
            <p>Click the button below to reset your password. This link will expire in 15 minutes.</p>
            <p>
              <a href="${resetLink}" style="display:inline-block;padding:12px 18px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:10px;">Reset password</a>
            </p>
            <p>If the button does not work, copy this link:</p>
            <p>${resetLink}</p>
          </div>
        `,
      });

      return res.redirect("/login?forgot=1&forgotSuccess=Reset link sent to your email");
    } catch (error) {
      console.error(error);
      return res.redirect("/login?forgot=1&forgotError=Could not send reset email");
    }
  };

  resetPasswordPage = async (req, res) => {
    try {
      const { token, id } = req.query || {};

      if (!token || !id) {
        return res.redirect("/login?error=Invalid reset link");
      }

      const existing = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
      if (!existing.rowCount) {
        return res.redirect("/login?error=User not found");
      }

      const user = existing.rows[0];
      const secret = `${process.env.RESET_PASSWORD_SECRET}${user.password}`;

      jwt.verify(token, secret);

      return res.render("reset-password", {
        title: "Reset Password",
        token,
        id,
      });
    } catch (error) {
      console.error(error);
      return res.redirect("/login?error=Reset link is invalid or expired");
    }
  };

  resetPassword = async (req, res) => {
    try {
      const { token, id, password } = req.body || {};

      if (!token || !id || !password) {
        return res.render("reset-password", {
          title: "Reset Password",
          token,
          id,
          error: "New password is required",
        });
      }

      const existing = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
      if (!existing.rowCount) {
        return res.redirect("/login?error=User not found");
      }

      const user = existing.rows[0];
      const secret = `${process.env.RESET_PASSWORD_SECRET}${user.password}`;

      jwt.verify(token, secret);

      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, id]);

      return res.redirect("/login?success=Password updated successfully");
    } catch (error) {
      console.error(error);
      return res.render("reset-password", {
        title: "Reset Password",
        token: req.body?.token,
        id: req.body?.id,
        error: "Reset link is invalid or expired",
      });
    }
  };

  logout = (req, res) => {
    res.clearCookie("userId");
    return res.redirect("/login");
  };
}

export default new AuthController();
