const bcrypt = require("bcrypt");
const NodeCache = require("node-cache");
const { PrismaClient } = require("@prisma/client");

const { generateToken, generatePasswordResetToken } = require("./token");
const validateEmail = require("../../../../helpers/validate/fields");
const { emailForgetPassword } = require("../../../../helpers/mail/mail");
const { ValidationError, AuthError } = require("../../../../helpers");
const { logger } = require("../../../../middlewares");

const getRandomImageUrl = require("../../../../helpers/picture/picture_sorter");

const cache = new NodeCache({ stdTTL: 864000, checkperiod: 1800 });
const prisma = new PrismaClient();

/**
 * Registra um novo usuário.
 * @param {string} email
 * @param {string} password
 * @param {string} name
 * @returns {object} usuário criado
 * @throws {ValidationError} se os dados forem inválidos
 * @throws {Error} se ocorrer um erro durante o registro
 */
async function registerUser(email, password, name) {
  if (!email || !password || !name) {
    throw new ValidationError("All fields are required");
  }
  if (!validateEmail(email)) {
    throw new ValidationError("Invalid email format");
  }
  if (password.length < 6) {
    throw new ValidationError("Password must be at least 6 characters long");
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ValidationError("Email is already in use");
  }

  try {
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        picture: getRandomImageUrl(
          "https://door-api.fabricadesoftware.ifc.edu.br"
        ),
      }, //mudar depois paia
    });
    return user;
  } catch (error) {
    logger.error(`Registration failed: ${error.message}`);
    throw new Error(`Registration failed: ${error.message}`);
  }
}

/**
 * Realiza o login do usuário.
 * @param {string} email
 * @param {string} password
 * @returns {object} contendo token e dados do usuário
 * @throws {ValidationError} se os dados forem inválidos
 * @throws {AuthError} se usuário não for encontrado ou a senha estiver incorreta
 */
async function loginUser(email, password) {
  if (!email || !password) {
    throw new ValidationError("Email and password are required");
  }
  if (!validateEmail(email)) {
    throw new ValidationError("Invalid email format");
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    logger.info(`User fetched: ${JSON.stringify(user)}`);
    if (!user) {
      throw new AuthError("User not found");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    logger.info(`Password comparison result: ${isMatch}`);
    if (!isMatch) {
      throw new AuthError("Incorrect password");
    }

    const token = generateToken(user.id);
    await prisma.user.update({
      where: { id: user.id },
      data: { updated_at: new Date() },
    });
    return { token, user };
  } catch (error) {
    logger.error(`Login failed: ${error.message}`);
    throw error;
  }
}

/**
 * Verifica o usuário utilizando cache para otimização.
 * @param {object} userData - deve conter userId
 * @returns {object} com flags de verificação do usuário
 * @throws {AuthError} se o usuário não for encontrado
 */
async function verifyUser(userData) {
  try {
    logger.info(`Verifying user: ${JSON.stringify(userData)}`);
    const cacheKey = `user_${userData.userId}`;
    const cachedUser = cache.get(cacheKey);
    if (cachedUser) {
      return cachedUser;
    }

    const user = await prisma.user.findUnique({
      where: { id: userData.userId },
    });
    logger.info(`User fetched for verification: ${JSON.stringify(user)}`);
    if (!user) {
      throw new AuthError("User not found");
    }

    const userToCache = { isSuper: user.isSuper, isVerify: user.isVerified };
    cache.set(cacheKey, userToCache);
    return userToCache;
  } catch (error) {
    logger.error(`Verification failed: ${error.message}`);
    throw new Error(`Verification failed: ${error.message}`);
  }
}

/**
 * Inicia o processo de redefinição de senha.
 * @param {string} email
 * @returns {object} com informações do envio de e-mail e dados do usuário atualizado
 * @throws {ValidationError} se o email for inválido
 * @throws {AuthError} se o usuário não for encontrado
 */
async function forgetPassword(email) {
  if (!email) {
    throw new ValidationError("Email is required");
  }
  if (!validateEmail(email)) {
    throw new ValidationError("Invalid email format");
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AuthError("User not found");
    }

    const token = generatePasswordResetToken(user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { token: token },
    });

    const mail = await emailForgetPassword(token, [email]);
    return { mail, update: user };
  } catch (error) {
    logger.error(`Password reset process failed: ${error.message}`);
    throw new Error(`Password reset failed: ${error.message}`);
  }
}

/**
 * Redefine a senha do usuário utilizando um token.
 * @param {string} token
 * @param {string} newPassword
 * @returns {string} mensagem de sucesso
 * @throws {ValidationError} se os dados forem inválidos
 * @throws {AuthError} se o usuário não for encontrado
 */
async function resetPassword(token, newPassword) {
  if (!token || !newPassword) {
    throw new ValidationError("Token and new password are required");
  }
  if (newPassword.length < 6) {
    throw new ValidationError("Password must be at least 6 characters long");
  }

  try {
    // OBS.: É esperado que o token seja armazenado em um campo específico (não sobrescrevendo a senha)
    const user = await prisma.user.findUnique({ where: { token: token } });
    if (!user) {
      throw new AuthError("User not found");
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, token: null },
    });

    return "Password updated successfully";
  } catch (error) {
    logger.error(`Password update failed: ${error.message}`);
    throw new Error(`Password reset failed: ${error.message}`);
  }
}

module.exports = {
  loginUser,
  registerUser,
  verifyUser,
  forgetPassword,
  resetPassword,
};
