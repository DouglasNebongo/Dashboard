/*
  Warnings:

  - Added the required column `amount` to the `CustomerUser` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `CustomerUser` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('pending', 'paid');

-- AlterTable
ALTER TABLE "CustomerUser" ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "InvoiceStatus" NOT NULL;
