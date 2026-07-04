const axios = require("axios");

const githubClient = axios.create({
  baseURL: "https://api.github.com",
  headers: process.env.GITHUB_TOKEN
    ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
    : undefined,
});

async function getGithubProfile(req, res, next) {
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({ message: "GitHub username is required" });
    }

    const [profileResponse, eventsResponse] = await Promise.all([
      githubClient.get(`/users/${username}`),
      githubClient.get(`/users/${username}/events/public`, {
        params: { per_page: 30 },
      }),
    ]);

    const contributionEvents = eventsResponse.data.filter((event) =>
      ["PushEvent", "PullRequestEvent", "IssuesEvent"].includes(event.type),
    );

    res.json({
      profile: {
        username: profileResponse.data.login,
        name: profileResponse.data.name,
        avatarUrl: profileResponse.data.avatar_url,
        publicRepos: profileResponse.data.public_repos,
        followers: profileResponse.data.followers,
        following: profileResponse.data.following,
      },
      recentActivity: contributionEvents.map((event) => ({
        id: event.id,
        type: event.type,
        repo: event.repo.name,
        createdAt: event.created_at,
      })),
    });
  } catch (error) {
    if (error.response?.status === 404) {
      return res.status(404).json({ message: "GitHub user not found" });
    }

    next(error);
  }
}

async function getGithubStreak(req, res, next) {
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({ message: "GitHub username is required" });
    }

    console.log(`Fetching streak for user: ${username}`);

    if (!process.env.GITHUB_TOKEN) {
      console.error("ERROR: GITHUB_TOKEN is not set in Backend/.env");
      return res.status(500).json({ message: "Server configuration error: Missing GITHUB_TOKEN" });
    }

    // Using GitHub GraphQL API v4
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

    const response = await axios.post(
      "https://api.github.com/graphql",
      {
        query,
        variables: { username },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (response.data.errors) {
      console.error("GitHub GraphQL Errors:", JSON.stringify(response.data.errors));
      return res.status(400).json({
        message: "GitHub GraphQL error",
        errors: response.data.errors,
      });
    }

    if (!response.data.data?.user) {
      console.error(`User not found in GitHub GraphQL: ${username}`);
      return res.status(404).json({ message: "GitHub user not found" });
    }

    const calendar = response.data.data.user.contributionsCollection.contributionCalendar;
    const days = calendar.weeks
      .flatMap((week) => week.contributionDays)
      .reverse();

    console.log(`Successfully fetched ${days.length} days of activity`);

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const today = new Date().toISOString().split("T")[0];

    // Calculate current streak (must include today or yesterday)
    let streakActive = true;
    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      if (day.contributionCount > 0) {
        if (streakActive) {
          currentStreak++;
        }
        tempStreak++;
      } else {
        // If we hit a zero-contribution day and it's not today, the "current" streak is over
        if (day.date !== today) {
          streakActive = false;
        }

        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
        tempStreak = 0;
      }
    }

    // Final check for longest streak
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }

    res.json({
      username,
      totalContributions: calendar.totalContributions,
      currentStreak,
      longestStreak,
      days: days.slice(0, 30).reverse(), // Last 30 days for display
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getGithubProfile,
  getGithubStreak,
};
