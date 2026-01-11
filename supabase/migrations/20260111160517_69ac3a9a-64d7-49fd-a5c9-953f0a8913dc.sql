-- Create chat messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for chat messages
-- Anyone authenticated can view all messages
CREATE POLICY "Authenticated users can view all messages" 
ON public.chat_messages 
FOR SELECT 
TO authenticated
USING (true);

-- Users can only insert their own messages
CREATE POLICY "Users can insert their own messages" 
ON public.chat_messages 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own messages
CREATE POLICY "Users can delete their own messages" 
ON public.chat_messages 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at DESC);

-- Enable realtime for chat_messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;