const User = require("../models/User");
const axios = require("axios");

// All possible progression missions (One-time)
const PROGRESSION_MISSIONS = [
    { id: "prog_1", title: "Rookie Start", description: "Reach Level 2", xpReward: 50, reqLevel: 1, category: "level", target: 2 },
    { id: "prog_2", title: "First Pulse", description: "Claim your first daily check-in", xpReward: 50, reqLevel: 1, category: "checkin" },
    { id: "prog_3", title: "Code Initiate", description: "Make 1 GitHub commit today", xpReward: 100, reqLevel: 1, category: "commit", target: 1 },
    { id: "prog_4", title: "Social Coder", description: "View the Global Leaderboard", xpReward: 30, reqLevel: 1, category: "view" },
    { id: "prog_5", title: "Steady Gainer", description: "Accumulate 200 Total XP", xpReward: 100, reqLevel: 2, category: "xp", target: 200 },
    { id: "prog_6", title: "Pro Aspirant", description: "Reach Level 3", xpReward: 150, reqLevel: 2, category: "level", target: 3 },
    { id: "prog_7", title: "Streak Starter", description: "Achieve a 2-day check-in streak", xpReward: 100, reqLevel: 2, category: "checkin_streak", target: 2 },
    { id: "prog_8", title: "Bug Squasher", description: "Push code today (must have commit)", xpReward: 200, reqLevel: 2, category: "commit", target: 1 },
    { id: "prog_9", title: "XP Hunter", description: "Accumulate 500 Total XP", xpReward: 200, reqLevel: 3, category: "xp", target: 500 },
    { id: "prog_10", title: "Master Class", description: "Reach Level 4", xpReward: 250, reqLevel: 3, category: "level", target: 4 },
    { id: "prog_11", title: "Hardcore Dev", description: "Push code today for 300 XP", xpReward: 300, reqLevel: 3, category: "commit", target: 1 },
    { id: "prog_12", title: "Week Warrior", description: "Achieve a 7-day GitHub streak", xpReward: 500, reqLevel: 3, category: "github_streak", target: 7 },
    { id: "prog_13", title: "Grandmaster Path", description: "Reach Level 5", xpReward: 400, reqLevel: 4, category: "level", target: 5 },
    { id: "prog_14", title: "XP Mogul", description: "Accumulate 1000 Total XP", xpReward: 500, reqLevel: 4, category: "xp", target: 1000 },
    { id: "prog_15", title: "Git Legend", description: "Push code today for massive XP", xpReward: 1000, reqLevel: 5, category: "commit", target: 1 },
    { id: "prog_16", title: "Consistent King", description: "14-day check-in streak", xpReward: 600, reqLevel: 4, category: "checkin_streak", target: 14 },
    { id: "prog_17", title: "Commit Machine", description: "3 commits detected today", xpReward: 150, reqLevel: 3, category: "commit_count", target: 3 },
    { id: "prog_18", title: "Night Owl", description: "Push code after 10 PM", xpReward: 100, reqLevel: 2, category: "commit_time", target: 22 },
    { id: "prog_19", title: "Early Bird", description: "Push code before 8 AM", xpReward: 100, reqLevel: 2, category: "commit_time", target: 8 },
    { id: "prog_20", title: "Top 10 Bound", description: "Reach Top 10 on Leaderboard", xpReward: 1000, reqLevel: 5, category: "ranking", target: 10 },
    { id: "prog_21", title: "Halfway Hero", description: "Accumulate 2500 XP", xpReward: 1200, reqLevel: 5, category: "xp", target: 2500 },
    { id: "prog_22", title: "Code Architect", description: "Push to a repo today", xpReward: 400, reqLevel: 4, category: "commit", target: 1 },
    { id: "prog_23", title: "Unstoppable", description: "30-day GitHub streak", xpReward: 2000, reqLevel: 6, category: "github_streak", target: 30 },
    { id: "prog_24", title: "XP Overlord", description: "Accumulate 4000 XP", xpReward: 1500, reqLevel: 6, category: "xp", target: 4000 },
    { id: "prog_25", title: "Legacy Builder", description: "Commit code today", xpReward: 2000, reqLevel: 6, category: "commit", target: 1 },
    { id: "prog_26", title: "Legendary Step", description: "Reach Level 6", xpReward: 2500, reqLevel: 6, category: "level", target: 6 },
    { id: "prog_27", title: "Community Icon", description: "Check in today", xpReward: 300, reqLevel: 4, category: "checkin" },
    { id: "prog_28", title: "Perfect Month", description: "30-day check-in streak", xpReward: 1500, reqLevel: 5, category: "checkin_streak", target: 30 },
    { id: "prog_29", title: "Zen Coder", description: "Make a commit today", xpReward: 800, reqLevel: 4, category: "commit", target: 1 },
    { id: "prog_30", title: "GitPulse Legend", description: "Achieve 5000 XP", xpReward: 5000, reqLevel: 6, category: "xp", target: 5000 },
];

async function getGithubStats(username) {
    if (!process.env.GITHUB_TOKEN) return null;
    const query = `
      query($username: String!) {
        user(login: $username) {
          contributionsCollection {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  contributionCount
                  date
                }
              }
            }
          }
        }
      }
    `;

    try {
        const res = await axios.post("https://api.github.com/graphql",
            { query, variables: { username } },
            { headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } }
        );
        const calendar = res.data.data.user.contributionsCollection.contributionCalendar;
        const days = calendar.weeks.flatMap(w => w.contributionDays).reverse();

        let currentStreak = 0;
        const today = new Date().toISOString().split("T")[0];
        let streakActive = true;

        for (let i = 0; i < days.length; i++) {
            if (days[i].contributionCount > 0) {
                if (streakActive) currentStreak++;
            } else {
                if (days[i].date !== today) streakActive = false;
            }
        }

        return {
            todayCount: days[0].date === today ? days[0].contributionCount : 0,
            currentStreak,
            total: calendar.totalContributions
        };
    } catch (e) {
        return null;
    }
}

async function claimDailyCheckIn(req, res, next) {
  try {
    const { clientDate, missionId } = req.body;
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    let xpGained = 0;

    // 1. Handle Daily Check-in
    if (missionId === "daily_pulse") {
        const today = clientDate || new Date().toISOString().split("T")[0];
        const lastCheckIn = user.lastCheckIn ? user.lastCheckIn.toISOString().split("T")[0] : null;
        if (lastCheckIn === today) return res.status(400).json({ message: "Already checked in today" });

        xpGained = 50;
        user.lastCheckIn = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];
        user.checkInStreak = (lastCheckIn === yesterdayStr) ? user.checkInStreak + 1 : 1;
    }
    // 2. Handle Progression Missions with strict safeguards
    else {
        const mission = PROGRESSION_MISSIONS.find(m => m.id === missionId);
        if (!mission) return res.status(404).json({ message: "Mission not found" });
        if (user.completedMissions.includes(missionId)) return res.status(400).json({ message: "Mission already completed" });
        if (user.level < mission.reqLevel) return res.status(400).json({ message: "Level too low for this mission" });

        // SAFEGUARD VERIFICATION LOGIC
        let isEligible = false;
        let failMessage = "Requirements not met for this mission.";

        switch (mission.category) {
            case "level":
                isEligible = user.level >= mission.target;
                failMessage = `Reach Level ${mission.target} first!`;
                break;
            case "xp":
                isEligible = user.xp >= mission.target;
                failMessage = `You need ${mission.target} total XP!`;
                break;
            case "checkin_streak":
                isEligible = user.checkInStreak >= mission.target;
                failMessage = `Maintain a ${mission.target}-day check-in streak first!`;
                break;
            case "commit":
            case "commit_count":
            case "github_streak":
                const stats = await getGithubStats(user.githubUsername);
                if (!stats) {
                    failMessage = "Could not verify GitHub activity. Try again later.";
                } else if (mission.category === "commit" || mission.category === "commit_count") {
                    isEligible = stats.todayCount >= (mission.target || 1);
                    failMessage = `GitHub commits required today: ${mission.target || 1}. Found: ${stats.todayCount}`;
                } else {
                    isEligible = stats.currentStreak >= mission.target;
                    failMessage = `GitHub streak required: ${mission.target} days. Your current: ${stats.currentStreak}`;
                }
                break;
            case "checkin":
                const today = clientDate || new Date().toISOString().split("T")[0];
                const lastCheckIn = user.lastCheckIn ? user.lastCheckIn.toISOString().split("T")[0] : null;
                isEligible = lastCheckIn === today;
                failMessage = "Claim your Daily Pulse first!";
                break;
            case "ranking":
                const rank = await User.countDocuments({ xp: { $gt: user.xp } }) + 1;
                isEligible = rank <= mission.target;
                failMessage = `Reach Top ${mission.target} on the leaderboard! Your rank: #${rank}`;
                break;
            case "view":
                isEligible = true; // Social/View missions are rewarded upon request
                break;
        }

        if (!isEligible) return res.status(400).json({ message: failMessage });

        xpGained = mission.xpReward;
        user.completedMissions.push(missionId);
    }

    user.xp += xpGained;
    user.level = Math.floor(user.xp / 100) + 1;
    await user.save();

    res.json({
      message: "Success! Reward granted.",
      xpGained,
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
        const { clientDate } = req.query;
        const userId = req.user.id;
        const user = await User.findById(userId);

        const today = clientDate || new Date().toISOString().split("T")[0];
        const lastCheckIn = user.lastCheckIn ? user.lastCheckIn.toISOString().split("T")[0] : null;

        let availableMissions = [];

        if (lastCheckIn !== today) {
            availableMissions.push({
                id: "daily_pulse",
                title: "Daily Pulse",
                description: "Check in to keep your streak alive",
                xpReward: 50,
                completed: false,
                type: "recurring",
                requiresCommit: false
            });
        }

        const pendingProgression = PROGRESSION_MISSIONS.filter(
            m => !user.completedMissions.includes(m.id)
        );

        const progressionMissions = pendingProgression.map(m => ({
            ...m,
            completed: false,
            type: "progression",
            requiresCommit: ["commit", "commit_count", "github_streak"].includes(m.category)
        }));

        availableMissions = [...availableMissions, ...progressionMissions];
        res.json(availableMissions.slice(0, 4));
    } catch (error) {
        next(error);
    }
}

module.exports = {
  claimDailyCheckIn,
  getMissions
};
