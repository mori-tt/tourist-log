-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "articleId" INTEGER,
ADD COLUMN     "tipAmount" INTEGER,
ALTER COLUMN "topicId" DROP NOT NULL,
ALTER COLUMN "adFee" DROP NOT NULL;
