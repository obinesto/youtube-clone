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
    const channelId = searchParams.get("channelId");

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Verify the email matches the token
    if (email !== decodedToken.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get user_id from email
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (userError) {
      throw userError;
    }

    // Check if a user is subscribed to a channel
    if (channelId) {
      const { data: subscribed, error: isSubscribedError } = await supabase
        .from("subscriptions")
        .select("channel_id")
        .eq("user_id", user.id)
        .eq("channel_id", channelId);

      if (isSubscribedError && isSubscribedError !== "PGRST116") {
        // PGRST116 is "no rows returned"
        throw isSubscribedError;
      }

      return NextResponse.json({
        isSubscribed: subscribed && subscribed.length > 0,
      });
    }

    // Fetch all subscriptions for the user
    const { data: subscriptions, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id);

    if (subError) {
      throw subError;
    }

    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { email, channelId, action } = await request.json();

    if (!email || !channelId) {
      return NextResponse.json(
        { error: "Email and channelId are required" },
        { status: 400 }
      );
    }

    // Verify the email matches the token
    const decodedToken = await validateRequest(request);
    if (!decodedToken || email !== decodedToken.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get user_id from email
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (userError) {
      throw userError;
    }

    if (action === "add") {
      // Insert new subscription
      const { error: insertError } = await supabase
        .from("subscriptions")
        .insert([{ user_id: user.id, channel_id: channelId }]);

      if (insertError) {
        throw insertError;
      }

      return NextResponse.json({ message: "Subscribed successfully" });
    } else if (action === "remove") {
      // Delete existing subscription
      const { error: deleteError } = await supabase
        .from("subscriptions")
        .delete()
        .eq("user_id", user.id)
        .eq("channel_id", channelId);

      if (deleteError) {
        throw deleteError;
      }

      return NextResponse.json({ message: "Unsubscribed successfully" });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error handling subscription:", error);
    return NextResponse.json(
      { error: "Failed to handle subscription" },
      { status: 500 }
    );
  }
}
