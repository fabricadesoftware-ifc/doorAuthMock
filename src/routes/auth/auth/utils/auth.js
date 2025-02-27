const bcrypt = require("bcrypt");
const NodeCache = require("node-cache");
const { PrismaClient } = require("@prisma/client");

const { generateToken, generatePasswordResetToken } = require("./token");
const validateEmail = require("../../../../helpers/validate/fields");
const { emailForgetPassword } = require("../../../../helpers/mail/mail");
const { ValidationError, AuthError } = require("../../../../helpers");
const { logger } = require("../../../../middlewares");

const cache = new NodeCache({ stdTTL: 864000, checkperiod: 1800 });
const prisma = new PrismaClient();

async function registerUser(email, password, name) {
  if (!email || !password || !name) {
    return new ValidationError("All fields are required");
  }

  if (!validateEmail(email)) {
    return new ValidationError("Invalid email format");
  }

  if (password.length < 6) {
    return new ValidationError("Password must be at least 6 characters long");
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return new ValidationError("Email is already in use");
  }

  try {
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });
    return user;
  } catch (error) {
    return new Error(`Registration failed: ${error.message}`);
  }
}

async function loginUser(email, password) {
  if (!email || !password) {
    return new ValidationError("Email and password are required");
  }

  if (!validateEmail(email)) {
    return new ValidationError("Invalid email format");
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return new AuthError("User not found");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return new AuthError("Incorrect password");
    }

    const token = generateToken(user.id);
    await prisma.user.update({
      where: { id: user.id },
      data: { updated_at: new Date() },
    });
    return { token, user };
  } catch (error) {
    return new Error(`Login failed: ${error.message}`);
  }
}

async function verifyUser(userData) {
  try {
    logger.info(userData)
    const cacheKey = `user_${userData.userId}`;

    const cachedUser = cache.get(cacheKey);
    if (cachedUser) {
      logger.info(cachedUser)
      return cachedUser;
    }

    const user = await prisma.user.findUnique({
      where: { id: userData.userId },
    });
    logger.info(user)

    if (!user) {
      return new AuthError("User not found");
    }

    const isSuper = user.isSuper;
    const isVerify = user.isVerified;
    const userToCache = { isSuper, isVerify };

    cache.set(cacheKey, userToCache);

    return userToCache;
  } catch (error) {
    return new Error(`Verification failed: ${error.message}`);
  }
}

async function forgetPassword(email) {
  if (!email) {
    return new ValidationError("Email is required");
  }

  if (!validateEmail(email)) {
    return new ValidationError("Invalid email format");
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return new AuthError("User not found");
    }
    const token = generatePasswordResetToken(user.id);
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(token, salt);

    const update = await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    const mail = await emailForgetPassword(token, [email]);
    return { mail, update };
  } catch (error) {
    return new Error(`Password reset failed: ${error.message}`);
  }
}

module.exports = {
  loginUser,
  registerUser,
  verifyUser,
  forgetPassword,
};
