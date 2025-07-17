-- Create videos table
CREATE TABLE IF NOT EXISTS public.videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  video_url TEXT NOT NULL,
  public_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  is_user_video BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, public_id)
);

-- Create likes table
CREATE TABLE IF NOT EXISTS public.video_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  video_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, video_id)
);

-- Create saved_videos table
CREATE TABLE IF NOT EXISTS public.saved_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  video_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, video_id)
);

-- Create watch_history table
CREATE TABLE IF NOT EXISTS public.watch_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  video_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, video_id)
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  channel_id TEXT NOT NULL,
  channel_title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, channel_id)
);


-- Create indexes
CREATE INDEX IF NOT EXISTS video_likes_user_id_idx ON public.video_likes(user_id);
CREATE INDEX IF NOT EXISTS video_likes_video_id_idx ON public.video_likes(video_id);
CREATE INDEX IF NOT EXISTS saved_videos_user_id_idx ON public.saved_videos(user_id);
CREATE INDEX IF NOT EXISTS saved_videos_video_id_idx ON public.saved_videos(video_id);
CREATE INDEX IF NOT EXISTS watch_history_user_id_idx ON public.watch_history(user_id);
CREATE INDEX IF NOT EXISTS watch_history_video_id_idx ON public.watch_history(video_id);
CREATE INDEX IF NOT EXISTS videos_user_id_idx ON public.videos(user_id);
CREATE INDEX IF NOT EXISTS videos_public_id_idx ON public.videos(public_id);
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_channel_id_idx ON public.subscriptions(channel_id);
CREATE INDEX IF NOT EXISTS subscriptions_channel_title_idx ON public.subscriptions(channel_title);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- CREATE TRIGGER update_videos_updated_at
-- BEFORE UPDATE ON public.videos
-- FOR EACH ROW
-- EXECUTE PROCEDURE update_updated_at_column();
