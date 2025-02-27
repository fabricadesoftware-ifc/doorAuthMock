const express = require("express");
const logger = require("../../../middlewares/logger/logger");
const { checkHealth, checkIp } = require("./utils/health");

const router = new express.Router();

router.post("/health", async (req, res) => {
    try {
        const health = await checkHealth();
        res.status(200).json({ success: true, data: health });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
    });

router.post("/ip", async (req, res) => {
    const { ip } = req.body;

    if (!ip) {
        return res.status(400).json({ success: false, error: "Ip is required" });
    }
    try {
        res.status(200).json({ success: true, message: "Ip saved" });
        await checkIp(ip);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;