-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "isError" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isProcessing" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "articleId" SET DATA TYPE TEXT;
