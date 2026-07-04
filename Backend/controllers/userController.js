const User = require("../models/User");
const { client: redis } = require("../config/redis");

async function getLeaderboard(req, res, next) {
  try {
    // Try to get from cache
    if (process.env.REDIS_URL) {
        const cached = await redis.get("leaderboard");
        if (cached) {
            return res.json(JSON.parse(cached));
        }
    }

    // Fetch top 20 users sorted by XP
    const users = await User.find({})
      .sort({ xp: -1 })
      .limit(20)
      .select("username avatarUrl xp level");

    const getRankInfo = (lvl, total) => {
      if (total >= 5000) return { name: "Legendary", color: "#FFD700" };
      if (lvl >= 5) return { name: "Grandmaster", color: "#FF3B72" };
      if (lvl >= 4) return { name: "Master", color: "#00E884" };
      if (lvl >= 3) return { name: "Pro", color: "#3B82F6" };
      return { name: "Rookie", color: "#A7AEC4" };
    };

    const leaderboard = users.map((u, index) => {
      const rank = getRankInfo(u.level, u.xp);
      return {
        ...u.toJSON(),
        rankName: rank.name,
        rankColor: rank.color,
        position: index + 1
      };
    });

    // Save to cache for 5 minutes
    if (process.env.REDIS_URL) {
        await redis.set("leaderboard", JSON.stringify(leaderboard), {
            EX: 300 // 5 minutes
        });
    }

    res.json(leaderboard);
  } catch (error) {
    next(error);
  }
}

async function getProfile(req, res, next) {
    try {
        const user = await User.findById(req.user.id);
        res.json(user);
    } catch (error) {
        next(error);
    }
}

module.exports = {
  getLeaderboard,
  getProfile
};
