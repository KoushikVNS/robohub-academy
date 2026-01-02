-- Add difficulty level enum
CREATE TYPE public.quiz_difficulty AS ENUM ('easy', 'medium', 'hard');

-- Add new columns to quizzes table
ALTER TABLE public.quizzes 
ADD COLUMN difficulty quiz_difficulty NOT NULL DEFAULT 'medium',
ADD COLUMN timer_per_question integer NOT NULL DEFAULT 120,
ADD COLUMN total_questions integer NOT NULL DEFAULT 10;

-- Add hint column to quiz_questions table
ALTER TABLE public.quiz_questions 
ADD COLUMN hint text;