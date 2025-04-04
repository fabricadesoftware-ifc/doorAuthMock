const express = require("express");

const {
  loginUser,
  registerUser,
  verifyUser,
  forgetPassword,
  resetPassword,
} = require("./utils/auth");
const { validateRequestBody } = require("../../../helpers/validate/request");
const { verifyToken } = require("./utils/token");
const { logger } = require("../../../middlewares");

const router = new express.Router();

/**
 * Rota de login do usuário.
 * Recebe email e senha e retorna token e dados do usuário, sem a senha.
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Validação básica dos campos
  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, error: "Email and password are required" });
  }

  try {
    const { token, user } = await loginUser(email, password);
    // Removendo o campo de senha para não expor informações sensíveis
    const { password: _, ...userWithoutPassword } = user;
    return res
      .status(200)
      .json({ success: true, token, data: userWithoutPassword });
  } catch (error) {
    logger.error(`Login route error: ${error.message}`);
    return res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * Rota de registro do usuário.
 * Recebe nome, email e senha e cria um novo usuário.
 */
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  // Validação dos campos requeridos
  const error = validateRequestBody(["name", "email", "password"], req.body);
  if (error) {
    return res.status(400).json({ success: false, error });
  }

  try {
    await registerUser(email, password, name);
    return res
      .status(201)
      .json({ success: true, message: "User registered successfully" });
  } catch (error) {
    logger.error(`Register route error: ${error.message}`);
    return res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * Rota de verificação do usuário.
 * Utiliza o token de autorização para recuperar dados de verificação do usuário.
 */
router.get("/verify", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res
      .status(400)
      .json({ success: false, error: "Authorization token is required" });
  }

  try {
    const userData = verifyToken(token);
    const userVerification = await verifyUser(userData);
    return res.status(200).json({ success: true, data: userVerification });
  } catch (error) {
    logger.error(`Verify route error: ${error.message}`);
    return res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * Rota para solicitação de redefinição de senha.
 * Envia email com instruções para redefinir a senha.
 */
router.post("/forget", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: "Email is required" });
  }
  try {
    await forgetPassword(email);
    return res
      .status(200)
      .json({ success: true, message: "Password reset email sent" });
  } catch (error) {
    logger.error(`Forget password route error: ${error.message}`);
    return res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * Rota para redefinição de senha.
 * Recebe token e nova senha, e atualiza a senha do usuário.
 */
router.post("/reset", async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res
      .status(400)
      .json({ success: false, error: "Token and new password are required" });
  }
  try {
    await resetPassword(token, newPassword);
    return res
      .status(200)
      .json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    logger.error(`Reset password route error: ${error.message}`);
    return res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
