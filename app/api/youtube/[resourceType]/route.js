import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { resourceType } = params;
  const { searchParams } = new URL(request.url);
  const apiKey = process.env.YOUTUBE_API_KEY;

  searchParams.set("key", apiKey);

  const url = `https://www.googleapis.com/youtube/v3/${resourceType}?${searchParams.toString()}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      console.error("YouTube API error:", data);
      return NextResponse.json({ error: data.error }, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
