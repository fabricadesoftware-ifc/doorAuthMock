const { PrismaClient } = require("@prisma/client");
const NodeCache = require("node-cache");

const { logger } = require("../../../../middlewares");
const {
  dateFormat,
  NotFoundError,
  ValidationError,
} = require("../../../../helpers");

const cache = new NodeCache({ stdTTL: 864000, checkperiod: 3600 });
const prisma = new PrismaClient();

async function validateRfid(rfid) {
  if (!rfid) {
    return new ValidationError("RFID is required");
  }

  try {
    const cacheKey = `tag_rfid`;

    const cachedTags = cache.get(cacheKey);
    if (cachedTags) {
      const cachedTag = cachedTags.find((tag) => tag.rfid == rfid);
      if (cachedTag) {
        await prisma.rfidTag.update({
          where: { id: cachedTag.id },
          data: {
            last_time_used: new Date(),
            used_times: cachedTag.used_times + 1,
          },
        });
        return cachedTag.valid;
      } else {
        return false;
      }
    }

    const tags = await prisma.rfidTag.findMany();

    if (!tags) {
      return new NotFoundError("RFIDS not found");
    }

    const tagsToCache = tags;

    cache.set(cacheKey, tagsToCache);

    const tag = tags.find((tag) => tag.rfid == rfid);
    if (tag) {
      await prisma.rfidTag.update({
        where: { id: tag.id },
        data: { last_time_used: new Date(), used_times: tag.used_times + 1 },
      });
      return tag.valid;
    }
  } catch (error) {
    return new Error(`Validation failed: ${error.message}`);
  }
}

async function createRfid(rfid) {
  if (!rfid) {
    return new ValidationError("RFID is required");
  }

  try {
    const newRfid = await prisma.rfidTag.create({ data: { rfid } });
    logger.info("RFID created successfully");
    return newRfid;
  } catch (error) {
    return new Error(`Creation failed: ${error.message}`);
  }
}

async function removeRfid(id) {
  if (!id) {
    return new ValidationError("RFID is required");
  }

  try {
    const removedRfid = await prisma.rfidTag.delete({ where: { id: id } });
    logger.info("RFID removed successfully");
    return removedRfid;
  } catch (error) {
    return new Error(`Removal failed: ${error.message}`);
  }
}

async function getAllRfids() {
  try {
    const rfids = await prisma.rfidTag.findMany({
      include: { user: true },
    });
    rfids.forEach((rfid) => {
      rfid.created_at = dateFormat(rfid.created_at);
      rfid.last_time_used = dateFormat(rfid.last_time_used);
      rfid.updated_at = dateFormat(rfid.updated_at);
      if (rfid?.user) {
        delete rfid.user.password;
      }
    });
    logger.info("Retrieved all RFIDs successfully");
    return rfids;
  } catch (error) {
    return new Error(`Failed to retrieve RFIDs: ${error.message}`);
  }
}

async function assignRfidToUser(rfid, userId) {
  if (!rfid || !userId) {
    return new ValidationError("RFID and User ID are required");
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { tags_owned: { connect: { rfid } } },
    });

    await prisma.rfidTag.update({
      where: { rfid },
      data: {
        valid: true,
        user: { connect: { id: userId } },
      },
    });

    logger.info("RFID assigned to user successfully");
    return updatedUser;
  } catch (error) {
    return new Error(`Failed to assign RFID: ${error.message}`);
  }
}

async function desAssignRfidToUser(rfid, userId) {
  if (!rfid || !userId) {
    return new ValidationError("RFID and User ID are required");
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { tags_owned: { disconnect: { rfid } } },
    });

    await prisma.rfidTag.update({
      where: { rfid },
      data: {
        valid: false,
        user: { disconnect: { id: userId } },
      },
    });

    logger.info("RFID desassigned to user successfully");
    return updatedUser;
  } catch (error) {
    return new Error(`Failed to desassign RFID: ${error.message}`);
  }
}

async function permissionRfid(rfid) {
  if (!rfid === undefined) {
    return new ValidationError("RFID and valid are required");
  }

  try {
    const tag = await prisma.rfidTag.findUnique({ where: { id: rfid } });
    const updatedRfid = await prisma.rfidTag.update({
      where: { id: rfid },
      data: { valid: !tag.valid },
    });

    return updatedRfid;
  } catch (error) {
    return new Error(`Failed to update RFID permission: ${error.message}`);
  }
}

async function getRfid(rfid) {
  if (!rfid) {
    return new ValidationError("RFID is required");
  }

  try {
    const tag = await prisma.rfidTag.findUnique({ where: { rfid } });

    if (!tag) {
      return new NotFoundError("RFID not found");
    }

    return tag;
  } catch (error) {
    return new Error(`Failed to get RFID: ${error.message}`);
  }
}

module.exports = {
  validateRfid,
  removeRfid,
  getAllRfids,
  assignRfidToUser,
  permissionRfid,
  desAssignRfidToUser,
  createRfid,
  getRfid,
};
