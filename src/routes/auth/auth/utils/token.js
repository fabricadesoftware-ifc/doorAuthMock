const jwt = require("jsonwebtoken");

const { JWT_SECRET } = require("../../../../config");

function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    return { error: error.message };
  }
}

const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "3h" });
};

const generatePasswordResetToken = (userId) => {
  const token = jwt
    .sign({ userId }, JWT_SECRET, { expiresIn: "5m" })
    .slice(0, 10);
  return token;
};

module.exports = {
  verifyToken,
  generateToken,
  generatePasswordResetToken,
};
