const express = require("express");

const {
  getGithubProfile,
  getGithubStreak,
} = require("../controllers/githubController");

const router = express.Router();

router.get("/streak/:username", getGithubStreak);
router.get("/:username", getGithubProfile);

module.exports = router;
