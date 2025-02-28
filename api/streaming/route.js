import { NextResponse } from "next/server"
import { supabase } from "../../../lib/utils/supabase"

export async function POST(request) {
  const { userId, title, description } = await request.json()

  if (!userId || !title || !description) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const { data, error } = await supabase.from("streams").insert({ user_id: userId, title, description }).single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const streamId = searchParams.get("streamId")

  if (!streamId) {
    return NextResponse.json({ error: "Stream ID is required" }, { status: 400 })
  }

  const { data, error } = await supabase.from("streams").select("*").eq("id", streamId).single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PATCH(request) {
  const { streamId, status } = await request.json()

  if (!streamId || !status) {
    return NextResponse.json({ error: "Stream ID and status are required" }, { status: 400 })
  }

  const { data, error } = await supabase.from("streams").update({ status }).eq("id", streamId).single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

