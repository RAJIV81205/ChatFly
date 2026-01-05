/*
  Warnings:

  - Added the required column `cloudinaryPublicId` to the `MessageFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uploaderId` to the `MessageFile` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'FILE', 'MIXED', 'SYSTEM');

-- CreateEnum
CREATE TYPE "FileStatus" AS ENUM ('ACTIVE', 'REVOKED', 'DELETED');

-- AlterTable
ALTER TABLE "ConversationMember" ADD COLUMN     "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "type" "MessageType" NOT NULL DEFAULT 'TEXT',
ALTER COLUMN "content" DROP NOT NULL,
ALTER COLUMN "contentIv" DROP NOT NULL;

-- AlterTable
ALTER TABLE "MessageFile" ADD COLUMN     "cloudinaryPublicId" TEXT NOT NULL,
ADD COLUMN     "revokedAt" TIMESTAMP(3),
ADD COLUMN     "status" "FileStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "uploaderId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "MessageFile_messageId_idx" ON "MessageFile"("messageId");

-- AddForeignKey
ALTER TABLE "MessageFile" ADD CONSTRAINT "MessageFile_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
