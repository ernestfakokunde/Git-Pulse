const express = require("express");
const { claimDailyCheckIn, getMissions } = require("../controllers/missionController");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, getMissions);
router.post("/claim", auth, claimDailyCheckIn);

module.exports = router;
