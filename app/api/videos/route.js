import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { v2 as cloudinary } from 'cloudinary';
import { validateRequest } from '@/lib/utils/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Initialize Supabase client
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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const ids = searchParams.get("ids");

    if (!email && !ids) {
      return NextResponse.json({ error: "Either email or ids is required" }, { status: 400 });
    }

    let query = supabase.from("videos").select("*");

    if (ids) {
      // Fetch specific videos by IDs (for liked/watch later lists)
      const videoIds = ids.split(",");
      query = query.in("id", videoIds);
    } else {
      // Verify the email matches the token for user-specific requests
      if (email !== decodedToken.email) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
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

      // Then get their videos
      query = query.eq("user_id", user.id);
    }

    // Execute the query
    const { data: videos, error: videosError } = await query.order("created_at", { ascending: false });

    if (videosError) {
      throw videosError;
    }

    return NextResponse.json(videos);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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

    const formData = await request.formData();
    const videoFile = formData.get("videoFile");
    const title = formData.get("title");
    const description = formData.get("description");
    const email = formData.get("email");
    const action = formData.get("action");

    // Verify the email matches the token
    if (email !== decodedToken.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (!videoFile || typeof videoFile === 'string' || !title || !description || !action) {
      return NextResponse.json(
        { error: "Missing required fields (ensure videoFile is a file)" },
        { status: 400 }
      );
    }

    // video file validation
    if (!(videoFile instanceof File)) {
      return NextResponse.json(
        { error: "videoFile must be a file" },
        { status: 400 }
      );
    }

    if (videoFile.size > 100 * 1024 * 1024) { // 100MB limit
      return NextResponse.json(
        { error: "File size exceeds 100MB" },
        { status: 400 }
      );
    }

    if (!["video/mp4", "video/x-matroska"].includes(videoFile.type)) {
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 400 }
      );
    }

    // Get the user_id
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (userError) {
      throw userError;
    }

    // Convert video file to buffer for Cloudinary upload
    const bytes = await videoFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const cloudinaryUpload = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "video",
          folder: "Youtube Clone",
          eager: [
            { format: 'jpg', transformation: [
              { width: 1280, height: 720, crop: 'fill' },
              { quality: 'auto:good' }
            ]}
          ],
          eager_async: false
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      uploadStream.end(buffer);
    });

    // Generate thumbnail URL - this is a direct thumbnail URL from the video
    const thumbnailUrl = cloudinary.url(cloudinaryUpload.public_id, {
      resource_type: 'video',
      transformation: [
        { width: 1280, height: 720, crop: 'fill' },
        { quality: 'auto:good', format: 'jpg' }
      ]
    });

    // Then check for existing video using the Cloudinary public_id
    const { data: existingVideo, error: findError } = await supabase
      .from("videos")
      .select("*")
      .eq("video_url", cloudinaryUpload.secure_url)
      .single();

    if (findError && findError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw findError;
    }

    // Handle different actions
    if (existingVideo) {
      if (action === "update") {
        const { data: updatedVideo, error: updateError } = await supabase
          .from("videos")
          .update({
            title,
            description,
            video_url: cloudinaryUpload.secure_url,
            public_id: cloudinaryUpload.public_id,
            thumbnail_url: thumbnailUrl,
            updated_at: new Date().toISOString()
          })
          .eq("id", existingVideo.id)
          .select("*")
          .single();

        if (updateError) {
          throw updateError;
        }
        return NextResponse.json(updatedVideo);

      } else if (action === "delete") {
        // Delete from Cloudinary first
        await cloudinary.uploader.destroy(existingVideo.public_id, { resource_type: "video" });
        
        const { error: deleteError } = await supabase
          .from("videos")
          .delete()
          .eq("id", existingVideo.id);

        if (deleteError) {
          throw deleteError;
        }
        return NextResponse.json({ success: true });

      } else if (action === "view") {
        return NextResponse.json(existingVideo);
      }

      return NextResponse.json(
        { error: "Invalid action for existing video" },
        { status: 400 }
      );
    }

    // Handle new video creation
    if (action !== "create") {
      return NextResponse.json(
        { error: "Invalid action for new video" },
        { status: 400 }
      );
    }

    const { data: newVideo, error: insertError } = await supabase
      .from("videos")
      .insert([
        {
          title,
          description,
          user_id: user.id,
          video_url: cloudinaryUpload.secure_url,
          public_id: cloudinaryUpload.public_id,
          thumbnail_url: thumbnailUrl,
          is_user_video: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select("*")
      .single();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json(newVideo);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
