const express = require("express");

const authRoutes = require("./authRoutes");
const githubRoutes = require("./githubRoutes");
const userRoutes = require("./userRoutes");
const { getHealth } = require("../controllers/healthController");

const router = express.Router();

router.get("/health", getHealth);
router.use("/auth", authRoutes);
router.use("/github", githubRoutes);
router.use("/users", userRoutes);

module.exports = router;
