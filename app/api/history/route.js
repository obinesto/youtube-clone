import { NextResponse } from "next/server";
import { auth } from "@/lib/utils/firebase";
import { db } from "@/lib/utils/supabase";

export async function GET(request) {
  try {
    const token = request.headers.get("Authorization")?.split("Bearer ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const { data, error } = await db
      .from("watch_history")
      .select("*")
      .eq("user_id", userId)
      .order("watched_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ history: data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const token = request.headers.get("Authorization")?.split("Bearer ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;
    const { videoId } = await request.json();

    const { error } = await db.from("watch_history").insert({
      user_id: userId,
      video_id: videoId,
      watched_at: new Date().toISOString(),
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const token = request.headers.get("Authorization")?.split("Bearer ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Allow deleting a specific video from history or clearing entire history
    const { videoId } = await request.json();
    
    const query = db.from("watch_history").delete().eq("user_id", userId);
    if (videoId) {
      query.eq("video_id", videoId);
    }

    const { error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}