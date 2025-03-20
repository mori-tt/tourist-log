-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");
