import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  try {
    if (id) {
      const { data, error } = await supabase.from("videos").select("*").eq("id", id).single()

      if (error) throw error
      if (!data) return NextResponse.json({ error: "Video not found" }, { status: 404 })

      return NextResponse.json(data)
    } else {
      const { data, error } = await supabase.from("videos").select("*").order("created_at", { ascending: false })

      if (error) throw error
      return NextResponse.json(data)
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  const { title, description, file } = await request.json()

  if (!title || !description || !file) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  try {
    const filePath = `videos/${Date.now()}_${file.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage.from("videos").upload(filePath, file)

    if (uploadError) throw uploadError

    const { data: videoData, error: insertError } = await supabase.from("videos").insert([
      {
        title,
        description,
        file_path: filePath,
        user_id: request.user.id,
        thumbnail_url: generateThumbnail(filePath),
      },
    ])

    if (insertError) throw insertError

    return NextResponse.json(videoData, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function generateThumbnail(filePath) {
  // Implement thumbnail generation logic here
  return `https://via.placeholder.com/320x180.png?text=Thumbnail`
}

