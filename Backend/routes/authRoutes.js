const express = require("express");

const {
  login,
  loginWithGithub,
  register,
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/github", loginWithGithub);

module.exports = router;
