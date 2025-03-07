-- Create likes table
CREATE TABLE IF NOT EXISTS public.video_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  video_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, video_id)
);

-- Create watch_later table
CREATE TABLE IF NOT EXISTS public.watch_later (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  video_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, video_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS video_likes_user_id_idx ON public.video_likes(user_id);
CREATE INDEX IF NOT EXISTS video_likes_video_id_idx ON public.video_likes(video_id);
CREATE INDEX IF NOT EXISTS watch_later_user_id_idx ON public.watch_later(user_id);
CREATE INDEX IF NOT EXISTS watch_later_video_id_idx ON public.watch_later(video_id);

-- Disable RLS for now since we're using service role
ALTER TABLE public.video_likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_later DISABLE ROW LEVEL SECURITY;