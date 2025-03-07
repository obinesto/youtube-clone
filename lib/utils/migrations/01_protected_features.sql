-- Create videos table
CREATE TABLE IF NOT EXISTS videos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'unlisted', 'private')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create watch_history table
CREATE TABLE IF NOT EXISTS watch_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  watched_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, video_id)
);

-- Create video_likes table
CREATE TABLE IF NOT EXISTS video_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  liked_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, video_id)
);

-- Create watch_later table
CREATE TABLE IF NOT EXISTS watch_later (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, video_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_user_id ON watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_video_likes_user_id ON video_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_later_user_id ON watch_later(user_id);

-- Create RLS policies for videos
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public videos are viewable by everyone" ON videos
  FOR SELECT USING (visibility = 'public');

CREATE POLICY "Users can view their own videos" ON videos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own videos" ON videos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own videos" ON videos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own videos" ON videos
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for watch_history
ALTER TABLE watch_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own watch history" ON watch_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own watch history" ON watch_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watch history" ON watch_history
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for video_likes
ALTER TABLE video_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own likes" ON video_likes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own likes" ON video_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON video_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for watch_later
ALTER TABLE watch_later ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own watch later list" ON watch_later
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own watch later list" ON watch_later
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own watch later list" ON watch_later
  FOR DELETE USING (auth.uid() = user_id);

-- Create functions for aggregations
CREATE OR REPLACE FUNCTION get_video_stats(video_id UUID)
RETURNS TABLE (
  like_count BIGINT,
  view_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM video_likes WHERE video_likes.video_id = $1),
    (SELECT COUNT(*) FROM watch_history WHERE watch_history.video_id = $1);
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;