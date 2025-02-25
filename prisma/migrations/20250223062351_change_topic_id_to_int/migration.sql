/*
  Warnings:

  - Changed the type of `topicId` on the `Transaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "topicId",
ADD COLUMN     "topicId" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "Transaction_topicId_idx" ON "Transaction"("topicId");

ALTER TABLE "Article"
     ALTER COLUMN "topicId" TYPE INTEGER USING "topicId"::INTEGER;
