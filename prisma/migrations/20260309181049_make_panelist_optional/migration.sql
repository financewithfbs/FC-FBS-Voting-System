/*
  Warnings:

  - A unique constraint covering the columns `[debateId,teamId]` on the table `PanelistScore` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "PanelistScore" DROP CONSTRAINT "PanelistScore_panelistId_fkey";

-- DropIndex
DROP INDEX "PanelistScore_debateId_panelistId_teamId_key";

-- AlterTable
ALTER TABLE "PanelistScore" ALTER COLUMN "panelistId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PanelistScore_debateId_teamId_key" ON "PanelistScore"("debateId", "teamId");

-- AddForeignKey
ALTER TABLE "PanelistScore" ADD CONSTRAINT "PanelistScore_panelistId_fkey" FOREIGN KEY ("panelistId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
