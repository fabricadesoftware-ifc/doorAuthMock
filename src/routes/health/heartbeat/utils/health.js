const { PrismaClient } = require("@prisma/client");

const { HealthError, ValidationError } = require("../../../../helpers");

const prisma = new PrismaClient();

async function checkHealth() {
  try {
    await prisma.$connect();
    await prisma.$disconnect();
    return "OK";
  } catch (error) {
    return new HealthError(`Health check failed: ${error.message}`);
  }
}

async function checkIp(ip) {
  if (!ip) {
    return new ValidationError("Ip is required");
  }
  try {
    await prisma.ip.update({
      where: {
        id: 1,
      },
      data: {
        ip: ip,
        updated_at: new Date(),
      },
    });
  } catch (error) {
    console.error(error);
    return new HealthError(`Ip check failed: ${error.message}`);
  }
}

async function getIp(req) {
  try {
    const cacheKey = `ip_${req.user.id}`;
    const cachedIp = cache.get(cacheKey);

    if (cachedIp) {
      return cachedIp.ip;
    }

    const ip = await prisma.ip.findFirst();

    if (!ip) {
      return new HealthError("Ip not found");
    }
    const userToCache = { ip };
    cache.set(cacheKey, userToCache);
    return userToCache.ip;
  } catch (error) {
    console.error(error);
    return new HealthError(`Ip check failed: ${error.message}`);
  }
}

module.exports = { checkHealth, checkIp, getIp };
