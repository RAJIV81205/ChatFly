/*
  Warnings:

  - You are about to drop the `Call` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CallParticipant` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Call" DROP CONSTRAINT "Call_callerId_fkey";

-- DropForeignKey
ALTER TABLE "Call" DROP CONSTRAINT "Call_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "CallParticipant" DROP CONSTRAINT "CallParticipant_callId_fkey";

-- DropForeignKey
ALTER TABLE "CallParticipant" DROP CONSTRAINT "CallParticipant_userId_fkey";

-- DropTable
DROP TABLE "Call";

-- DropTable
DROP TABLE "CallParticipant";

-- DropEnum
DROP TYPE "CallStatus";

-- DropEnum
DROP TYPE "CallType";
