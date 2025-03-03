import { NextResponse } from "next/server";
import { sendRewardTransaction } from "../../../utils/symbol";
export async function POST(request: Request) {
  const body = await request.json();
  const { privateKey, recipientAddress, amount } = body;
  try {
    const result = await sendRewardTransaction(
      privateKey,
      recipientAddress,
      amount
    );
    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: "An unknown error occurred" },
      { status: 500 }
    );
  }
}
