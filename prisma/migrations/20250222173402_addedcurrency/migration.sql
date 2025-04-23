/*
  Warnings:

  - You are about to drop the column `address` on the `Customer` table. All the data in the column will be lost.
  - Added the required column `currency` to the `CustomerUser` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "address";

-- AlterTable
ALTER TABLE "CustomerUser" ADD COLUMN     "currency" TEXT NOT NULL;
