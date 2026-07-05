const User = require("../models/User");
const { client: redis } = require("../config/redis");

async function getLeaderboard(req, res, next) {
  try {
    let leaderboard;

    // 1. Try to get Top 20 from cache
    if (process.env.REDIS_URL) {
        const cached = await redis.get("leaderboard");
        if (cached) {
            leaderboard = JSON.parse(cached);
        }
    }

    // 2. If not cached, fetch from DB
    if (!leaderboard) {
      const users = await User.find({})
        .sort({ xp: -1 })
        .limit(20)
        .select("username avatarUrl xp level");

      const getRankInfo = (lvl, total) => {
        if (total >= 10000) return { name: "Legendary", color: "#FFD700" };
        if (lvl >= 51) return { name: "Grandmaster", color: "#FF3B72" };
        if (lvl >= 26) return { name: "Master", color: "#00E884" };
        if (lvl >= 11) return { name: "Pro", color: "#3B82F6" };
        return { name: "Rookie", color: "#A7AEC4" };
      };

      leaderboard = users.map((u, index) => {
        const rank = getRankInfo(u.level, u.xp);
        return {
          ...u.toJSON(),
          rankName: rank.name,
          rankColor: rank.color,
          position: index + 1
        };
      });

      // Save Top 20 to cache for 5 minutes
      if (process.env.REDIS_URL) {
          await redis.set("leaderboard", JSON.stringify(leaderboard), {
              EX: 300
          });
      }
    }

    // 3. Always calculate current user's personal rank live
    let userRank = null;
    if (req.user && req.user.id) {
        const currentUser = await User.findById(req.user.id);
        if (currentUser) {
            userRank = await User.countDocuments({ xp: { $gt: currentUser.xp } }) + 1;
        }
    }

    // 4. Send both the Top 20 AND the personal rank
    res.json({
        leaderboard,
        userRank
    });
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
