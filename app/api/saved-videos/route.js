import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { validateRequest } from "@/lib/utils/auth";

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
    // Verify auth token
    const decodedToken = await validateRequest(request);
    if (!decodedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const videoId = searchParams.get("videoId");

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Verify the email matches the token
    if (email !== decodedToken.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
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

    if (videoId) {
      // Check if specific video is in saved videos
      const { data: savedVideoItem, error: savedVideoItemError } =
        await supabase
          .from("saved_videos")
          .select("video_id")
          .eq("user_id", user.id)
          .eq("video_id", videoId)
          .single();

      if (savedVideoItemError && savedVideoItemError.code !== "PGRST116") {
        // PGRST116 is "no rows returned"
        throw savedVideoItemError;
      }

      return NextResponse.json({
        isInSavedVideos: savedVideoItem && savedVideoItem.length > 0,
      });
    }

    // Get all saved videos
    const { data: savedVideos, error: savedVideosError } = await supabase
      .from("saved_videos")
      .select("video_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (savedVideosError) {
      throw savedVideosError;
    }

    return NextResponse.json({ savedVideos });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // Verify auth token
    const decodedToken = await validateRequest(request);
    if (!decodedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { videoId, action, email } = await request.json();

    if (!videoId || !action || !email) {
      return NextResponse.json(
        { error: "VideoId, action, and email are required" },
        { status: 400 }
      );
    }

    // Verify the email matches the token
    if (email !== decodedToken.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
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

    if (action === "add") {
      const { error } = await supabase.from("saved_videos").insert([
        {
          user_id: user.id,
          video_id: videoId,
        },
      ]);

      if (error?.code === "23505") {
        // Unique violation
        return NextResponse.json({ success: true }); // Already in saved videos
      }
      if (error) throw error;
    } else if (action === "remove") {
      const { error } = await supabase
        .from("saved_videos")
        .delete()
        .eq("user_id", user.id)
        .eq("video_id", videoId);

      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Saved videos operation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
