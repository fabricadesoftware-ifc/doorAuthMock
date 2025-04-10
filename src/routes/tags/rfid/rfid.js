const express = require("express");
const {
  validateRfid,
  getAllRfids,
  removeRfid,
  assignRfidToUser,
  permissionRfid,
  desAssignRfidToUser,
  createRfid,
  getRfid,
} = require("./utils/rfid");
const validateRequestBody = require("../../../helpers/validate/fields");
const verifyUser = require("../../auth/auth/utils/auth");
const { logger } = require("../../../middlewares");
const { userLog } = require("../../logs/logs/logs");

const router = new express.Router();

router.post("/door", async (req, res) => {
  const { rfid } = req.body;
  if (!rfid) {
    return res.status(400).json({ success: false, error: "rfid is required" });
  }
  try {
    const isValid = await validateRfid(rfid);
    if (isValid) {
      return res.status(200).json({ success: true, message: "Door open" });
    } else {
    res.status(401).json({ success: false, message: "não autorizado skibidi" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Internal Server Error", error: error });
  }
});

router.post("/assign", async (req, res) => {
  const { rfid, userId } = req.body;

  const error = validateRequestBody(["rfid", "userId"], req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error, req: req.body });
  }
  try {
    const { isVerify, isSuper } = await verifyUser.verifyUser(req.user);
    if (!isVerify || !isSuper) {
      return res
        .status(403)
        .json({ success: false, error: "User no have permision" });
    }
    const isAssigned = await assignRfidToUser(rfid, Number(userId));
    if (!isAssigned) {
      return res
        .status(401)
        .json({ success: false, message: "RFID not assigned" });
    }
   
    res.status(200).json({ success: true, message: "RFID assigned to user successfully" });
    await userLog(
      req.user.id,
      `User ${req.user.name} assigned RFID ${rfid} to user ${userId}`,
      "UPDATE"
    );
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      });
  }
});

router.post("/desassign", async (req, res) => {
  const { rfid, userId } = req.body;

  const error = validateRequestBody(["rfid", "userId"], req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error });
  }
  try {
    const { isVerify, isSuper } = await verifyUser.verifyUser(req.user);
    if (!isVerify || !isSuper) {
      return res
        .status(403)
        .json({ success: false, error: "User no have permision" });
    }
    const isDesassigned = await desAssignRfidToUser(rfid, Number(userId));
    if (!isDesassigned) {
      res.status(401).json({ success: false, message: "RFID not desassigned" });
      
    }
    return res.status(200).json({
      success: true,
      message: "RFID desassigned to user successfully",
    });
    await userLog(
      req.user.id,
      `User ${req.user.name} desassigned RFID ${rfid} to user ${userId}`,
      "UPDATE"
    );
    
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      });
  }
});

router.get("/", async (req, res) => {
  if (!req.user) {
    return res.status(400).json({ success: false, error: "User not provided" });
  }
  try {
    const { isVerify } = await verifyUser.verifyUser(req.user);
    logger.info(isVerify)
    if (!isVerify) {
      return res
        .status(403)
        .json({ success: false, error: "User no have permision" });
    }
    const allRfids = await getAllRfids();
    res.status(200).json({ success: true, data: allRfids });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      });
  }
});

router.post("/:rfid", async (req, res) => {
  const { rfid } = req.params;

  try {
     const { isVerify, isSuper } = await verifyUser.verifyUser(req.user);
     if (!isVerify || !isSuper) {
       return res
         .status(403)
         .json({ success: false, error: "User no have permision" });
    }
    const exist = await getRfid(rfid);

    if (exist) {
      return res
        .status(409)
        .json({ success: false, message: "RFID already exists" });
    }

    await createRfid(rfid);

    res
      .status(201)
      .json({ success: true, message: "RFID created successfully" });
    await userLog(
      777,
      `User ${req.user.name} created RFID ${rfid}`,
      "CREATE"
    );
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { isVerify, isSuper } = await verifyUser.verifyUser(req.user);
    if (!isVerify || !isSuper) {
      return res
        .status(403)
        .json({ success: false, error: "User no have permision" });
    }
    const deletedRfid = await removeRfid(Number(id));
    res
      .status(200)
      .json({
        success: true,
        message: "RFID deleted successfully",
        data: deletedRfid,
      });
    await userLog(
      req.user.id,
      `User ${req.user.name} deleted RFID ${id}`,
      "DELETE"
    );
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      });
  }
});

router.put("/update/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { isVerify, isSuper } = await verifyUser.verifyUser(req.user);
    if (!isVerify || !isSuper) {
      return res
        .status(403)
        .json({ success: false, error: "User no have permission" });
    }
    const updatedRfid = await permissionRfid(Number(id));
    res
      .status(200)
      .json({
        success: true,
        message: "RFID updated successfully",
        data: updatedRfid,
      });
    await userLog(
      req.user.id,
      `User ${req.user.name} updated RFID ${id}`,
      "UPDATE"
    );
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      });
  }
});

module.exports = router;
