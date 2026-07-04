function getHealth(req, res) {
  res.json({
    status: "ok",
    service: "gitpulse-api",
    timestamp: new Date().toISOString(),
  });
}

module.exports = {
  getHealth,
};
