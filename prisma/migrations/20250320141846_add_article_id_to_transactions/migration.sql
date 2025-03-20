-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "articleId" INTEGER,
ADD COLUMN     "metadata" TEXT;

-- CreateIndex
CREATE INDEX "Transaction_articleId_idx" ON "Transaction"("articleId");
