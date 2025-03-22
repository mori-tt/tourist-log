/*
  Warnings:

  - You are about to drop the column `isError` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `isProcessing` on the `Transaction` table. All the data in the column will be lost.
  - The `articleId` column on the `Transaction` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "isError",
DROP COLUMN "isProcessing",
DROP COLUMN "articleId",
ADD COLUMN     "articleId" INTEGER;

-- CreateIndex
CREATE INDEX "Transaction_articleId_idx" ON "Transaction"("articleId");
