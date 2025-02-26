/*
  Warnings:

  - You are about to drop the column `purchaseAmount` on the `Article` table. All the data in the column will be lost.
  - You are about to drop the column `tipAmount` on the `Article` table. All the data in the column will be lost.
  - Added the required column `xymAmount` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Article" DROP COLUMN "purchaseAmount",
DROP COLUMN "tipAmount",
ADD COLUMN     "xymPrice" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "xymTipAmount" DOUBLE PRECISION DEFAULT 0;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "xymAmount" DOUBLE PRECISION NOT NULL;
