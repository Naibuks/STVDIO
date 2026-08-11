const mongoose = require("mongoose");
const { isDBConnected } = require("../config/db");

const getHealth = (req, res) => {
  res.json({
    status: "ok",
    service: "STVDIO° API",
    database: isDBConnected() ? "connected" : "disconnected",
    models: mongoose.modelNames().length,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
};

module.exports = { getHealth };
