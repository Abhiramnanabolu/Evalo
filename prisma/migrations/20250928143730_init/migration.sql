-- CreateEnum
CREATE TYPE "public"."TestStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."QuestionOrder" AS ENUM ('SEQUENTIAL', 'SHUFFLED');

-- CreateEnum
CREATE TYPE "public"."ResultVisibility" AS ENUM ('INSTANT', 'AFTER_TEST', 'HIDDEN');

-- CreateTable
CREATE TABLE "public"."Test" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER NOT NULL,
    "status" "public"."TestStatus" NOT NULL DEFAULT 'DRAFT',
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "allowBack" BOOLEAN NOT NULL DEFAULT true,
    "questionOrder" "public"."QuestionOrder" NOT NULL DEFAULT 'SEQUENTIAL',
    "attemptLimit" INTEGER,
    "retakeCooldown" INTEGER,
    "resultVisibility" "public"."ResultVisibility" NOT NULL DEFAULT 'AFTER_TEST',
    "passPercentage" DOUBLE PRECISION,
    "creatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Test_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Test" ADD CONSTRAINT "Test_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
