import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { validateRequest } from '@/lib/utils/auth';
import { sendPushNotification, getSubscriptionsForUser } from '@/lib/pwa';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

export async function GET(request) {
  try {
    // Verify auth token
    const decodedToken = await validateRequest(request);
    if (!decodedToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const videoId = searchParams.get('videoId');
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Verify the email matches the token
    if (email !== decodedToken.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // First get the user_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError) {
      throw userError;
    }

    if (videoId) {
      // Check if specific video is liked
      const { data: like, error: likeError } = await supabase
        .from('video_likes')
        .select('video_id')
        .eq('user_id', user.id)
        .eq('video_id', videoId)
        .single();

      if (likeError && likeError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw likeError;
      }

      return NextResponse.json({ isLiked: like && like.length > 0 });
    }

    // Get all liked videos
    const { data: likes, error: likesError } = await supabase
      .from('video_likes')
      .select('video_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (likesError) {
      throw likesError;
    }

    return NextResponse.json({ likes });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Verify auth token
    const decodedToken = await validateRequest(request);
    if (!decodedToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { videoId, action, email } = await request.json();

    if (!videoId || !action || !email) {
      return NextResponse.json(
        { error: 'VideoId, action, and email are required' },
        { status: 400 }
      );
    }

    // Verify the email matches the token
    if (email !== decodedToken.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // First get the user_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError) {
      throw userError;
    }

    if (action === 'like') {
      const { error } = await supabase
        .from('video_likes')
        .insert([{ 
          user_id: user.id,
          video_id: videoId
        }]);

      if (error?.code === '23505') { // Unique violation
        return NextResponse.json({ success: true }); // Already liked
      }
      if (error) throw error;

      // --- START: PUSH NOTIFICATION LOGIC (Self-Notification) ---
      try {
        // 1. Get the new total count of liked videos for the user.
        const { count, error: countError } = await supabase
          .from('video_likes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (countError) throw countError;

        // 2. Get the push subscriptions for the user who performed the action.
        const subscriptions = await getSubscriptionsForUser(user.id);

        // 3. Prepare the notification payload.
        const payload = {
          title: 'Liked Videos Updated!',
          body: `You now have ${count} liked videos.`,
          icon: '/icon.png',
        };

        // 4. Send a notification to each of the user's subscribed devices.
        for (const sub of subscriptions) {
          await sendPushNotification(sub, payload);
        }
      } catch (notificationError) {
        // Log the error but don't fail the main API request.
        // The user's "like" was still saved successfully.
        console.error('Failed to send like-count push notification:', notificationError);
      }
      // --- END: PUSH NOTIFICATION LOGIC ---
    } else if (action === 'unlike') {
      const { error } = await supabase
        .from('video_likes')
        .delete()
        .eq('user_id', user.id)
        .eq('video_id', videoId);

      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Like operation error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
