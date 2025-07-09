import { NextResponse } from "next/server";

// Helper function to make the API call and parse the JSON response
async function fetchYouTubeAPI(url) {
  const response = await fetch(url);
  const data = await response.json();
  return { response, data };
}

export async function GET(request, { params }) {
  const { resourceType } = params;
  const { searchParams } = new URL(request.url);
  const apiKey = process.env.YOUTUBE_API_KEY;
  const apiKey2 = process.env.YOUTUBE_API_KEY2;

  searchParams.set("key", apiKey);
  let url = `https://www.googleapis.com/youtube/v3/${resourceType}?${searchParams.toString()}`;

  try {
    let { response, data } = await fetchYouTubeAPI(url);

    if (
      !response.ok &&
      response.status === 403 &&
      data?.error?.message?.includes("quota")
    ) {
      console.log("API key 1 quota exceeded, trying API key 2...");

      searchParams.set("key", apiKey2);
      const fallbackUrl = `https://www.googleapis.com/youtube/v3/${resourceType}?${searchParams.toString()}`;

      const fallbackResult = await fetchYouTubeAPI(fallbackUrl);
      response = fallbackResult.response;
      data = fallbackResult.data;
    }

    if (!response.ok) {
      console.error("YouTube API error:", data);
      return NextResponse.json(
        {
          error:
            data.error?.message || "An unknown YouTube API error occurred.",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
