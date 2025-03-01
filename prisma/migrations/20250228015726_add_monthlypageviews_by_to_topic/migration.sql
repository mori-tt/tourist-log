-- CreateTable
CREATE TABLE "MonthlyPageView" (
    "id" SERIAL NOT NULL,
    "topicId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "pageViews" INTEGER NOT NULL DEFAULT 0,
    "isConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "confirmedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "transactionHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyPageView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MonthlyPageView_topicId_idx" ON "MonthlyPageView"("topicId");

-- CreateIndex
CREATE INDEX "MonthlyPageView_year_month_idx" ON "MonthlyPageView"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyPageView_topicId_year_month_key" ON "MonthlyPageView"("topicId", "year", "month");

-- AddForeignKey
ALTER TABLE "MonthlyPageView" ADD CONSTRAINT "MonthlyPageView_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
