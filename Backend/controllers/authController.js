const bcrypt = require("bcrypt");
const axios = require("axios");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "gitpulse_secret_key";
const JWT_EXPIRES_IN = "7d";

function signToken(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

async function register(req, res, next) {
  try {
    const { username, email, password, githubUsername } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "username, email, and password are required",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(409).json({
        message: "A user with that email or username already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      passwordHash,
      githubUsername,
      authProvider: "local",
    });

    const token = signToken(user._id);

    res.status(201).json({
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "email and password are required",
      });
    }

    const user = await User.findOne({ email }).select("+passwordHash");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken(user._id);

    res.json({
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
}

async function loginWithGithub(req, res, next) {
  try {
    const { code, redirectUri, codeVerifier } = req.body;

    if (!code || !redirectUri) {
      return res.status(400).json({
        message: "code and redirectUri are required",
      });
    }

    if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
      return res.status(500).json({
        message: "GitHub OAuth credentials are not configured",
      });
    }

    const tokenPayload = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
    });

    if (codeVerifier) {
      tokenPayload.append("code_verifier", codeVerifier);
    }

    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      tokenPayload,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    if (tokenResponse.data.error) {
      return res.status(401).json({
        message:
          tokenResponse.data.error_description ||
          "GitHub authorization failed",
      });
    }

    const accessToken = tokenResponse.data.access_token;

    if (!accessToken) {
      return res.status(401).json({
        message: "GitHub did not return an access token",
      });
    }

    const githubApi = axios.create({
      baseURL: "https://api.github.com",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
    });

    const [profileResponse, emailResponse] = await Promise.all([
      githubApi.get("/user"),
      githubApi.get("/user/emails").catch(() => ({ data: [] })),
    ]);

    const profile = profileResponse.data;
    const primaryEmail = emailResponse.data.find(
      (email) => email.primary && email.verified,
    );
    const fallbackEmail = `${profile.id}+${profile.login}@users.noreply.github.com`;
    const email = primaryEmail?.email || fallbackEmail;

    const githubUser = {
      authProvider: "github",
      githubId: String(profile.id),
      githubUsername: profile.login,
      username: profile.login,
      email,
      avatarUrl: profile.avatar_url,
    };

    let user;

    if (mongoose.connection.readyState === 1) {
      user = await User.findOneAndUpdate(
        { githubId: githubUser.githubId },
        githubUser,
        {
          new: true,
          setDefaultsOnInsert: true,
          upsert: true,
        },
      );
    } else {
      user = { ...githubUser, _id: "temp_" + profile.id };
    }

    const token = signToken(user._id);

    res.json({
      token,
      user,
      github: {
        accessToken, // Sending this back so the client can potentially use it or we use it for GraphQL
        username: profile.login,
        name: profile.name,
        avatarUrl: profile.avatar_url,
        publicRepos: profile.public_repos,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  loginWithGithub,
  register,
  login,
};
