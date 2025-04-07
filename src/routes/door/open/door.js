const express = require("express");
const axios = require("axios");

const verifyUser = require("../../auth/auth/utils/auth");
const logger = require("../../../middlewares/logger/logger");
const { DOOR_KEY } = require("../../../config");
const { getIp } = require("../../health/heartbeat/utils/health");

router = new express.Router();

router.get("/open", async (req, res) => {
  const { isVerify } = await verifyUser.verifyUser(req.user);
  if (!isVerify) {
    res.status(403).json({ success: false, error: "User no have permision" });
  }
  try {
    const ip = await getIp();
    if (!ip) {
      res.status(404).json({ success: false, error: "Ip not found" });
    }
    await axios.get(ip + ":19003/open-door", {
      headers: { Authorization: "Bearer " + DOOR_KEY },
    });
    res.status(200).json({ success: true, message: "Door opened" });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get("/mode", async (req, res) => {
  try {
    const ip = await getIp(req);
    const { isVerify, isSuper } = await verifyUser.verifyUser(req.user);
    if (!isVerify || !isSuper) {
      res.status(403).json({ error: "User no have permision" });
    } else if (!ip) {
      res.status(500).json({ error: "Ip not found" });
    }
    logger.info(ip);
    const url = "http://" + ip + ":19003/toggle-mode";
    logger.info(url);
    const response = await axios.get(url, {
      headers: { Authorization: "Bearer " + DOOR_KEY },
    });
    res.status(200).json({ success: true, data: response.data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
