const express = require("express");
const axios = require("axios");

const verifyUser = require("../../auth/auth/utils/auth");
const logger = require("../../../middlewares/logger/logger");
const { DOOR_KEY } = require("../../../config");
const { getIp, getMode } = require("../../health/heartbeat/utils/health");

router = new express.Router();

router.get("/open", async (req, res) => {
  const { isVerify } = await verifyUser.verifyUser(req.user);
  if (!isVerify) {
    res.status(403).json({ success: false, error: "User no have permision" });
  }
  try {
    const ip = await getIp(req);
    if (!ip) {
      res.status(404).json({ success: false, error: "Ip not found" });
    }
    const url = "http://" + ip + ":19003/open-door";
    logger.info("Opening door at " + url);
    await axios.get(url, {
      headers: { Authorization: "Bearer " + DOOR_KEY },
    });
    res.status(200).json({ success: true, message: "Door opened" });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post("/mode", async (req, res) => {
  const { mode } = req.body;
  if (mode === undefined) {
    return res.status(400).json({ success: false, error: "Mode not found" });
  }

  try {
    const ip = await getIp(req);
    const currentMode = await getMode();
    const { isVerify, isSuper } = await verifyUser.verifyUser(req.user);

    if (!isVerify || !isSuper) {
      return res.status(403).json({ error: "User does not have permission" });
    }
    if (!ip) {
      return res.status(500).json({ error: "Ip not found" });
    }

    // Check if requested mode is different from current mode
    if (currentMode === mode) {
      return res.status(200).json({ 
        success: true, 
        message: "Mode already set to requested value",
        currentMode: mode 
      });
    }

    const url = "http://" + ip.ip + ":19003/toggle-mode";
    logger.info(`Changing mode from ${currentMode} to ${mode} at ${url}`);
    
    const response = await axios.get(url, {
      headers: { Authorization: "Bearer " + DOOR_KEY },
    });
    
    res.status(200).json({ success: true, data: response.data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get("/mode", async (req, res) => {
  try{
    const mode = await getMode();
    if (!mode) {
      return res.status(404).json({ success: false, error: "Mode not found" });
    }
    res.status(200).json({ success: true, data: mode });
  }
  catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get("/cache", async (req, res) => {
  try {
    const ip = await getIp(req);
    if (!ip) {
      return res.status(404).json({ success: false, error: "Ip not found" });
    }
    const url = "http://" + ip.ip + ":19003/cache";
    logger.info("Cache URL: " + url);
    
    const response = await axios.get(url, {
      headers: { Authorization: "Bearer " + DOOR_KEY },
    });
    
    res.status(200).json({ success: true, data: response.data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});




module.exports = router;
