-- Create transaction type enum
CREATE TYPE public.xp_transaction_type AS ENUM ('quiz_completion', 'video_watched', 'admin_adjustment', 'admin_revert', 'monthly_reset');

-- Create xp_transactions table to track all XP changes
CREATE TABLE public.xp_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  transaction_type xp_transaction_type NOT NULL,
  reference_id UUID,
  reason TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create video_watch_history table
CREATE TABLE public.video_watch_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  watched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, video_id)
);

-- Create monthly_leaderboard_snapshots table
CREATE TABLE public.monthly_leaderboard_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  xp_points INTEGER NOT NULL,
  rank INTEGER NOT NULL CHECK (rank >= 1 AND rank <= 3),
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add xp_reward column to quizzes table
ALTER TABLE public.quizzes ADD COLUMN xp_reward INTEGER NOT NULL DEFAULT 10;

-- Add xp_reward column to videos table
ALTER TABLE public.videos ADD COLUMN xp_reward INTEGER NOT NULL DEFAULT 5;

-- Enable RLS on new tables
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_leaderboard_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for xp_transactions
CREATE POLICY "Users can view their own XP transactions"
ON public.xp_transactions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all XP transactions"
ON public.xp_transactions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert their own quiz/video XP transactions"
ON public.xp_transactions
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND 
  transaction_type IN ('quiz_completion', 'video_watched')
);

CREATE POLICY "Admins can insert any XP transactions"
ON public.xp_transactions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update XP transactions"
ON public.xp_transactions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for video_watch_history
CREATE POLICY "Users can view their own watch history"
ON public.video_watch_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own watch history"
ON public.video_watch_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all watch history"
ON public.video_watch_history
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for monthly_leaderboard_snapshots (public read)
CREATE POLICY "Anyone can view monthly leaderboard snapshots"
ON public.monthly_leaderboard_snapshots
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage monthly leaderboard snapshots"
ON public.monthly_leaderboard_snapshots
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update profiles xp_points
CREATE POLICY "Admins can update any profile xp_points"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));