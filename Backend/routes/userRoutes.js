const express = require("express");

const { getUserById, getUsers } = require("../controllers/userController");

const router = express.Router();

router.get("/", getUsers);
router.get("/:id", getUserById);

module.exports = router;
