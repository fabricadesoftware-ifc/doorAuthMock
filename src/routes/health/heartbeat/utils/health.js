const { PrismaClient } = require("@prisma/client");

const { HealthError, ValidationError } = require("../../../../helpers");
const NodeCache = require("node-cache");
const { logger } = require("../../../../middlewares");
const axios = require("axios");

const cache = new NodeCache({ stdTTL: 864000, checkperiod: 1800 });

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
    logger.info("health", userToCache);
    return userToCache.ip.ip;
  } catch (error) {
    console.error(error);
    return new HealthError(`Ip check failed: ${error.message}`);
  }
}

async function updateCache(req){
  try{
    const ip = await getIp(req);
    logger.info("passou aqui")
    if (!ip) {
      return new HealthError("Ip not found");
    }
    const url = "http://" + ip + ":19003/cache";

    const response = await axios.get(url, {
      headers : {
        Authorization: "Bearer " + DOOR_KEY
      }
    });
    
    return response.data;
  }
  catch(error){
    return new HealthError(`Cache update failed: ${error.message}`);
  }
}

module.exports = { checkHealth, checkIp, getIp, updateCache };
