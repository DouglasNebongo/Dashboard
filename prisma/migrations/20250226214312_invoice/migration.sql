/*
  Warnings:

  - You are about to drop the column `imageurl` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the `VerificationCode` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "imageurl",
ADD COLUMN     "imageUrl" TEXT;

-- DropTable
DROP TABLE "VerificationCode";
