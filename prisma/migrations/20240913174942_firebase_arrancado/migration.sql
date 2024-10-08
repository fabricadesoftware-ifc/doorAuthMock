/*
  Warnings:

  - You are about to drop the column `firebase_id` on the `user` table. All the data in the column will be lost.
  - You are about to drop the `userLogin` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[email]` on the table `user` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `user` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `user` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "user_firebase_id_key";

-- AlterTable
ALTER TABLE "user" DROP COLUMN "firebase_id",
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "password" TEXT NOT NULL;

-- DropTable
DROP TABLE "userLogin";

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");
