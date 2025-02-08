import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.isAdmin) {
    return NextResponse.json({ error: "認証されていません" }, { status: 401 });
  }

  // Extract the dynamic id from the pathname.
  // Assuming the URL structure is /api/users/[id]
  const segments = request.nextUrl.pathname.split("/");
  const id = segments.pop() || segments.pop(); // Handles potential trailing slash

  try {
    const deletedUser = await prisma.user.delete({
      where: { id },
    });
    return NextResponse.json({ deletedUser });
  } catch (error) {
    console.error("Error deleting user: ", error);
    return NextResponse.error() as NextResponse;
  }
}
