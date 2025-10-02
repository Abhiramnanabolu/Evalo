/*
  Warnings:

  - You are about to drop the column `required` on the `Question` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Question" DROP COLUMN "required",
ADD COLUMN     "negativePoints" DOUBLE PRECISION DEFAULT 0;
