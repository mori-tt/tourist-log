/*
  Warnings:

  - You are about to drop the column `monthlyPVThreshold` on the `Topic` table. All the data in the column will be lost.
  - You are about to drop the `MonthlyPageView` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "MonthlyPageView" DROP CONSTRAINT "MonthlyPageView_topicId_fkey";

-- AlterTable
ALTER TABLE "Topic" DROP COLUMN "monthlyPVThreshold";

-- DropTable
DROP TABLE "MonthlyPageView";
