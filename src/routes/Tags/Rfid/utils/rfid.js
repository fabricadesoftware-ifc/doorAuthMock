const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { logger } = require("../../../../middlewares");

// Custom Error Classes
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = "NotFoundError";
  }
}

async function validateRfid(rfid) {
  if (!rfid) {
    throw new ValidationError("RFID is required");
  }

  try {
    const tag = await prisma.rfidTag.findUnique({ where: { rfid } });

    if (tag) {
      await prisma.rfidTag.update({
        where: { rfid },
        data: { last_time_used: new Date(), used_times: { increment: 1 } },
      });
      if (tag.valid) {
        logger.info("RFID is valid, unlocking door");
        return true;
      } else {
        logger.info("RFID is invalid, door remains locked");
        return false;
      }
    }

    logger.warn("RFID not found, creating a new one");
    await prisma.rfidTag.create({ data: { rfid } });
    logger.info("New RFID created");

    return false;
  } catch (error) {
    throw new Error(`Validation failed: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

async function removeRfid(rfid) {
  if (!rfid) {
    throw new ValidationError("RFID is required");
  }

  try {
    const removedRfid = await prisma.rfidTag.delete({ where: { rfid } });
    logger.info("RFID removed successfully");
    return removedRfid;
  } catch (error) {
    throw new Error(`Removal failed: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

async function getAllRfids() {
  try {
    const rfids = await prisma.rfidTag.findMany();
    logger.info("Retrieved all RFIDs successfully");
    return rfids;
  } catch (error) {
    throw new Error(`Failed to retrieve RFIDs: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

async function assignRfidToUser(rfid, userId) {
  if (!rfid || !userId) {
    throw new ValidationError("RFID and User ID are required");
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
    throw new Error(`Failed to assign RFID: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

async function permissionRfid(rfid, permission) {
  if (!rfid || permission === undefined) {
    throw new ValidationError("RFID and valid are required");
  }

  try {
    const updatedRfid = await prisma.rfidTag.update({
      where: { rfid },
      data: { valid: permission },
    });

    logger.info("RFID permission updated successfully");
    return updatedRfid;
  } catch (error) {
    throw new Error(`Failed to update RFID permission: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = {
  validateRfid,
  removeRfid,
  getAllRfids,
  assignRfidToUser,
  permissionRfid,
};
