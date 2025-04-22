import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" }, 
        { status: 400 });
    }

    // First get the user_id
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (userError) {
      throw userError;
    }

    // Then get their watch history videos
    const { data: watchHistory, error: watchHistoryError } = await supabase
      .from("watch_history")
      .select("video_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (watchHistoryError) {
      throw watchHistoryError;
    }

    return NextResponse.json({ watchHistory });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { videoId, action, email } = await request.json();
    if (!videoId || !action || !email) {
      return NextResponse.json(
        { error: "VideoId, action, and email are required" },
        { status: 400 });
    }

    // First get the user_id
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (userError) {
      throw userError;
    }

    // Then insert or delete the video from watch history based on action
    if (action === "add") {
      const { error } = await supabase
        .from("watch_history")
        .insert([{
          user_id: user.id,
          video_id: videoId,
        }]);

      if (error?.code === "23505") { // Unique violation
        return NextResponse.json({ success: true }); // Already in watch history
      }
      if (error) throw error;
    } else if (action === "remove") {
      const { error } = await supabase
        .from("watch_history")
        .delete()
        .eq("user_id", user.id)
        .eq("video_id", videoId);
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 });
  }
}