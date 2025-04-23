/*
  Warnings:

  - Made the column `code` on table `VerificationCode` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "VerificationCode" ALTER COLUMN "code" SET NOT NULL;
