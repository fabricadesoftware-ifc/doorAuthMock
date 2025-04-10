const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { dateFormat, NotFoundError, ValidationError } = require("../../../../helpers");

async function getUserById(userId) {
  if (!userId) {
    return new ValidationError("User ID is required");
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return new NotFoundError("User not found");
    }
    user.created_at = dateFormat(user.created_at);
    user.updated_at = dateFormat(user.updated_at);
    delete user.password;
    return { user };
  } catch (error) {
    return new Error(`Failed to get user by ID: ${error.message}`);
  }
}

async function getAllUsers() {
  try {
    const users = await prisma.user.findMany();
    if (!users.length) {
      return new NotFoundError("No users found");
    }
    users.forEach((user) => {
      user.created_at = dateFormat(user.created_at);
      user.updated_at = dateFormat(user.updated_at);
      delete user.password;
    });
    return { users };
  } catch (error) {
    return new Error(`Failed to get all users: ${error.message}`);
  }
}

async function deleteUser(userId) {
  if (!userId) {
    return new ValidationError("User ID is required");
  }

  try {
    const userExist = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExist) {
      return new NotFoundError("User not found");
    }
    const user = await prisma.user.delete({ where: { id: userId } });
    return { user };
  } catch (error) {
    return new Error(`Failed to delete user: ${error.message}`);
  }
}

async function updateUser(userId, data) {
   if (!userId) {
     return new ValidationError("User ID is required" + userId);
   }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: data,
    });
    if (!user) {
      return new NotFoundError("User not found");
    }
    return { user };
  } catch (error) {
    return new Error(`Failed to update user: ${error.message}`);
  }
}


module.exports = {
  getUserById,
  getAllUsers,
  deleteUser,
  updateUser,
};
