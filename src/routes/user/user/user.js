const express = require("express");
const bcrypt = require("bcrypt");

const { getAllUsers, getUserById, deleteUser, updateUser} = require("./utils/user");
const { verifyUser } = require("../../auth/auth/utils/auth");
const {userLog} = require("../../logs/logs/logs");

const router = new express.Router();

router.get("/users", async (req, res) => {
    try {
        const { isVerify } = await verifyUser(req.user);
        if (!isVerify) {
        return res
          .status(403)
          .json({ success: false, error: "User no have permision" });
        }
        const users = await getAllUsers();
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

router.get("/users/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const { isVerify } = await verifyUser(req.user);
        if (!isVerify) {
        return res
          .status(403)
          .json({ success: false, error: "User no have permision" });
        }
        const user = await getUserById(Number(id));
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

router.delete("/users/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const { isVerify, isSuper } = await verifyUser(req.user);
        if (!isVerify || !isSuper) {
        return res
          .status(403)
          .json({ success: false, error: "User no have permision" });
        }
        const user = await deleteUser(Number(id));
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

router.put("/users/:id", async (req, res) => {
    const { isVerify, isSuper } = await verifyUser(req.user);
    if (!isVerify || !isSuper) {
    return res
      .status(403)
      .json({ success: false, error: "User no have permision" });
    }
    try {
        const userId = req.params.id;
        const { id, name, email, isVerified, isSuper, picture } = req.body;
        const user = await updateUser(Number(userId), {
          id,
          name,
          email,
          isVerified,
          isSuper,
          picture,
        });
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

router.patch("/users/:id", async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
        return res
          .status(400)
          .json({ success: false, error: "Password is required" });
    }
    try{
        const data = await verifyUser(req.user);
        if (!data.isVerify) {
            return res
              .status(403)
              .json({ success: false, error: "User no have permision" });
        }
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = await updateUser(Number(id), { hashedPassword });
        res.status(200).json({ success: true, data: user });
    }
    catch(error){
        res.status(400).json({ success: false, error: error.message });
    }
});

module.exports = router;