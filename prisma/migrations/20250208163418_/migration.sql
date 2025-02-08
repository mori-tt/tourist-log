-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "adFee" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);
