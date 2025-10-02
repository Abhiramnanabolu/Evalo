-- AlterTable
ALTER TABLE "public"."Question" ADD COLUMN     "sectionId" TEXT;

-- AlterTable
ALTER TABLE "public"."Test" ADD COLUMN     "hasSections" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "public"."Section" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Section_testId_idx" ON "public"."Section"("testId");

-- CreateIndex
CREATE INDEX "Section_testId_order_idx" ON "public"."Section"("testId", "order");

-- CreateIndex
CREATE INDEX "Question_sectionId_idx" ON "public"."Question"("sectionId");

-- CreateIndex
CREATE INDEX "Question_sectionId_order_idx" ON "public"."Question"("sectionId", "order");

-- AddForeignKey
ALTER TABLE "public"."Section" ADD CONSTRAINT "Section_testId_fkey" FOREIGN KEY ("testId") REFERENCES "public"."Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Question" ADD CONSTRAINT "Question_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;
