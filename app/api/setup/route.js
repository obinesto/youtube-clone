import { NextResponse } from "next/server";
import { setupDatabase } from "@/lib/utils/database";

export async function POST(request) {
  try {
    // Only allow setup in development
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        { error: "Setup only allowed in development" },
        { status: 403 }
      );
    }

    const result = await setupDatabase();
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}