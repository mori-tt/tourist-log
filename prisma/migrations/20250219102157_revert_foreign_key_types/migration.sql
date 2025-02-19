/*
  Warnings:

  - The primary key for the `Transaction` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `articleId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `tipAmount` on the `Transaction` table. All the data in the column will be lost.
  - The `id` column on the `Transaction` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Made the column `userId` on table `Article` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `type` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Made the column `topicId` on table `Transaction` required. This step will fail if there are existing NULL values in that column.
  - Made the column `adFee` on table `Transaction` required. This step will fail if there are existing NULL values in that column.
  - Made the column `transactionHash` on table `Transaction` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('advertisement', 'tip', 'purchase', 'receive_tip');

-- DropForeignKey
ALTER TABLE "Article" DROP CONSTRAINT "Article_userId_fkey";

-- AlterTable
ALTER TABLE "Article" ALTER COLUMN "topicId" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Topic" ALTER COLUMN "adFee" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_pkey",
DROP COLUMN "articleId",
DROP COLUMN "tipAmount",
ADD COLUMN     "type" "TransactionType" NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ALTER COLUMN "topicId" SET NOT NULL,
ALTER COLUMN "adFee" SET NOT NULL,
ALTER COLUMN "transactionHash" SET NOT NULL,
ADD CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "Transaction_topicId_idx" ON "Transaction"("topicId");

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
