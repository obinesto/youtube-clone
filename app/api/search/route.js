import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import axios from 'axios';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';

/**
 * Fetches video details in chunks to stay within API limits.
 * @param {string[]} videoIds - Array of video IDs.
 * @returns {Promise<object[]>} - Array of video detail items.
 */
const fetchVideoDetailsInChunks = async videoIds => {
  const CHUNK_SIZE = 50; // YouTube API limit for IDs per request
  const allVideoDetails = [];
  for (let i = 0; i < videoIds.length; i += CHUNK_SIZE) {
    const chunk = videoIds.slice(i, i + CHUNK_SIZE);
    if (chunk.length > 0) {
      try {
        const response = await axios.get(`${YOUTUBE_API_URL}/videos`, {
          params: {
            part: 'snippet,statistics,contentDetails',
            id: chunk.join(','),
            key: process.env.YOUTUBE_API_KEY,
          },
        });
        if (response.data?.items) {
          allVideoDetails.push(...response.data.items);
        }
      } catch (error) {
        console.error('Failed to fetch a chunk of video details:', error);
        // Don't throw, continue to the next chunk
      }
    }
  }
  return allVideoDetails;
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  const normalizedQuery = query.trim().toLowerCase();

  try {
    // 1. Check database cache first
    const { data: cachedData, error: cacheError } = await supabase
      .from('search_cache')
      .select('results')
      .eq('query', normalizedQuery)
      .single();

    if (cacheError && cacheError.code !== 'PGRST116' /*PGRST116 means no rows found*/) {
      console.error('Error fetching from cache:', cacheError);
    }

    if (cachedData) {
      // Asynchronously update the last_accessed_at timestamp
      supabase
        .from('search_cache')
        .update({ last_accessed_at: new Date().toISOString() })
        .eq('query', normalizedQuery)
        .then();
      return NextResponse.json(cachedData.results);
    }

    console.log(`Cache miss for query: "${normalizedQuery}". Fetching from YouTube.`);

    // 2. If no cache, fetch from YouTube API
    const searchResponse = await axios.get(`${YOUTUBE_API_URL}/search`, {
      params: {
        part: 'snippet',
        q: normalizedQuery,
        type: 'video',
        maxResults: 50,
        videoEmbeddable: 'true',
        key: process.env.YOUTUBE_API_KEY,
      },
    });

    const videoIds =
      searchResponse.data.items?.map(item => item.id.videoId).filter(Boolean) ||
      [];

    if (videoIds.length === 0) {
      return NextResponse.json([]);
    }

    const videoDetails = await fetchVideoDetailsInChunks(videoIds);

    // 3. Store the new results in the database cache
    if (videoDetails.length > 0) {
      const { error: insertError } = await supabase
        .from('search_cache')
        .insert({ query: normalizedQuery, results: videoDetails });

      if (insertError) {
        console.error('Error saving to cache:', insertError);
      }
    }

    return NextResponse.json(videoDetails);
  } catch (error) {
    console.error('Search API Error:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to fetch search results from YouTube.' },
      { status: 500 }
    );
  }
}
