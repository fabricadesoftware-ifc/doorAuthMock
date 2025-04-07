const express = require("express");
const { PrismaClient } = require("@prisma/client");

const { dateFormat } = require("../../../helpers");
const io = require("../../../../app");

const prisma = new PrismaClient();

router = new express.Router();

router.get("/", async (req, res) => {
  try {
    let { page, limit, startDate, endDate } = req.query;
    page = parseInt(page) || 1; 
    limit = parseInt(limit) || 10; 
    const skip = (page - 1) * limit;

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter = {
        date: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) })
        }
      };
    }

    const logs = await prisma.logs.findMany({
      where: dateFilter,
      skip: skip,
      take: limit,
      orderBy: {
        date: "desc", 
      },
    });

    logs.forEach((log) => {
      log.date = dateFormat(log.date);
    });

    const totalLogs = await prisma.logs.count({
      where: dateFilter
    });
    const totalPages = Math.ceil(totalLogs / limit);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        totalLogs,
        totalPages,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});


router.post("/", async (req, res) => {
  let { type, message } = req.body;
  if (!type || !message) {
    return res.status(400).json({ error: "type and message are required" });
  }

  if (message !== String){
    message = JSON.stringify(message)
  }
  res.status(200).json({ success: true, message: "Log is being processed" });

  try {
    const log = await prisma.logs.create({
      data: {
        type,
        message,
      },
    });

    io.io.emit("logs", { data: log });
  } catch (error) {
    console.error("Erro ao processar log:", error.message);
  }
});




module.exports = router;
