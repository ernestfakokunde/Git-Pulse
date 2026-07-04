require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const apiRoutes = require("./routes");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({
    message: "GitPulse API is running",
    routes: {
      health: "/api/health",
      auth: "/api/auth",
      github: "/api/github",
      users: "/api/users",
    },
  });
});

app.use("/api", apiRoutes);
app.use(notFound);
app.use(errorHandler);

async function startServer() {
  await connectDB();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`GitPulse API listening on http://0.0.0.0:${PORT}`);
    console.log(`Local network access: http://10.180.4.249:${PORT}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = app;
