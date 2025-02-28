import { NextResponse } from "next/server"
import { supabase } from "../../../lib/utils/supabase"

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const videoId = searchParams.get("videoId")

  if (!videoId) {
    return NextResponse.json({ error: "Video ID is required" }, { status: 400 })
  }

  const { data, error } = await supabase.from("likes").select("count").eq("video_id", videoId).single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ count: data?.count || 0 })
}

export async function POST(request) {
  const { videoId, userId } = await request.json()

  if (!videoId || !userId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const { data, error } = await supabase.from("likes").insert({ video_id: videoId, user_id: userId }).single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url)
  const videoId = searchParams.get("videoId")
  const userId = searchParams.get("userId")

  if (!videoId || !userId) {
    return NextResponse.json({ error: "Video ID and User ID are required" }, { status: 400 })
  }

  const { error } = await supabase.from("likes").delete().eq("video_id", videoId).eq("user_id", userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

