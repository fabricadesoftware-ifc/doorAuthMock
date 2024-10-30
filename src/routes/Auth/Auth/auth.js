const express = require('express');
const {
  loginUser,
  registerUser,
  verifyUser,
  forgetPassword,
} = require("./utils/auth");
const { validateRequestBody } = require('../../../helpers/validate/request');
const {  } = require('../../../middlewares');
const { verifyToken } = require('./utils/token');

const router = new express.Router();

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const error = validateRequestBody(['email', 'password'], req.body);
    if (error) {
        return res.status(400).json({ error });
    }

    try {
        const { token, user } = await loginUser(email, password);
        delete user.password;
        res.status(200).json({ token: token, data: user });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    const error = validateRequestBody(['name', 'email', 'password'], req.body);
    if (error) {
        return res.status(400).json({ error });
    }

    try {
        await registerUser(email, password, name);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/verify', async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    try {
        const userData = verifyToken(token);
        const { isSuper } = await verifyUser(userData);
        res.status(200).json({data: isSuper});
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/forget', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await forgetPassword(email);
        res.status(200).json({data: user});
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}
)

// router.get('/test', async (req, res) => {
//     const data = await verifyUser({ userId: 1 });
//     res.status(200).json({ message: 'Auth route working', data: data });
// });

module.exports = router;
