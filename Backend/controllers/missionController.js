const User = require("../models/User");
const axios = require("axios");

async function claimDailyCheckIn(req, res, next) {
  try {
    const userId = req.user.id; // From auth middleware
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const today = new Date().toISOString().split("T")[0];
    const lastCheckIn = user.lastCheckIn ? user.lastCheckIn.toISOString().split("T")[0] : null;

    if (lastCheckIn === today) {
      return res.status(400).json({ message: "Already checked in today" });
    }

    // Verify GitHub contribution for today if it's a "GitHub Check-in"
    // For now, let's just reward the manual check-in

    user.xp += 50;
    user.lastCheckIn = new Date();

    // Simple streak logic
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    if (lastCheckIn === yesterdayStr) {
      user.checkInStreak += 1;
    } else {
      user.checkInStreak = 1;
    }

    // Check for level up (every 100 XP)
    user.level = Math.floor(user.xp / 100) + 1;

    await user.save();

    res.json({
      message: "Check-in successful!",
      xpGained: 50,
      newTotalXp: user.xp,
      level: user.level,
      checkInStreak: user.checkInStreak
    });
  } catch (error) {
    next(error);
  }
}

async function getMissions(req, res, next) {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        const today = new Date().toISOString().split("T")[0];
        const lastCheckIn = user.lastCheckIn ? user.lastCheckIn.toISOString().split("T")[0] : null;

        const missions = [
            {
                id: "daily_checkin",
                title: "Daily Pulse",
                description: "Check in to keep your streak alive",
                xpReward: 50,
                completed: lastCheckIn === today,
                type: "manual"
            },
            {
                id: "github_commit",
                title: "Code Warrior",
                description: "Commit code to GitHub today",
                xpReward: 100,
                completed: false, // This would require GitHub API verification
                type: "github"
            }
        ];

        res.json(missions);
    } catch (error) {
        next(error);
    }
}

module.exports = {
  claimDailyCheckIn,
  getMissions
};
