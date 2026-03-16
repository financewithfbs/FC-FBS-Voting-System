/*
  Warnings:

  - You are about to drop the column `round` on the `PanelistScore` table. All the data in the column will be lost.
  - You are about to drop the column `round1Score` on the `Team` table. All the data in the column will be lost.
  - You are about to drop the column `round2Score` on the `Team` table. All the data in the column will be lost.
  - You are about to drop the column `round3Score` on the `Team` table. All the data in the column will be lost.
  - You are about to drop the column `round` on the `VotingControl` table. All the data in the column will be lost.
  - You are about to drop the `Vote` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[debateId,panelistId,teamId]` on the table `PanelistScore` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[debateId]` on the table `VotingControl` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `debateId` to the `PanelistScore` table without a default value. This is not possible if the table is not empty.
  - Added the required column `debateId` to the `VotingControl` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DebateStatus" AS ENUM ('UPCOMING', 'ACTIVE', 'COMPLETED');

-- DropForeignKey
ALTER TABLE "Vote" DROP CONSTRAINT "Vote_teamId_fkey";

-- DropForeignKey
ALTER TABLE "Vote" DROP CONSTRAINT "Vote_userId_fkey";

-- DropIndex
DROP INDEX "PanelistScore_teamId_panelistId_round_key";

-- DropIndex
DROP INDEX "VotingControl_round_key";

-- AlterTable
ALTER TABLE "PanelistScore" DROP COLUMN "round",
ADD COLUMN     "debateId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Team" DROP COLUMN "round1Score",
DROP COLUMN "round2Score",
DROP COLUMN "round3Score";

-- AlterTable
ALTER TABLE "VotingControl" DROP COLUMN "round",
ADD COLUMN     "debateId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Vote";

-- CreateTable
CREATE TABLE "Debate" (
    "id" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "debateNumber" INTEGER NOT NULL,
    "name" TEXT,
    "status" "DebateStatus" NOT NULL DEFAULT 'UPCOMING',
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Debate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DebateTeam" (
    "id" TEXT NOT NULL,
    "debateId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "score" DOUBLE PRECISION DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DebateTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DebateVote" (
    "id" TEXT NOT NULL,
    "debateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DebateVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DebateTeam_debateId_teamId_key" ON "DebateTeam"("debateId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "DebateVote_debateId_userId_key" ON "DebateVote"("debateId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "PanelistScore_debateId_panelistId_teamId_key" ON "PanelistScore"("debateId", "panelistId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "VotingControl_debateId_key" ON "VotingControl"("debateId");

-- AddForeignKey
ALTER TABLE "DebateTeam" ADD CONSTRAINT "DebateTeam_debateId_fkey" FOREIGN KEY ("debateId") REFERENCES "Debate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebateTeam" ADD CONSTRAINT "DebateTeam_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebateVote" ADD CONSTRAINT "DebateVote_debateId_fkey" FOREIGN KEY ("debateId") REFERENCES "Debate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebateVote" ADD CONSTRAINT "DebateVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebateVote" ADD CONSTRAINT "DebateVote_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PanelistScore" ADD CONSTRAINT "PanelistScore_debateId_fkey" FOREIGN KEY ("debateId") REFERENCES "Debate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VotingControl" ADD CONSTRAINT "VotingControl_debateId_fkey" FOREIGN KEY ("debateId") REFERENCES "Debate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
