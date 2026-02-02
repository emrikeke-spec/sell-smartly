-- Create automation_tasks table to queue actions for the desktop app
CREATE TABLE public.automation_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('grailed', 'vinted', 'plick')),
  action TEXT NOT NULL CHECK (action IN ('post', 'update', 'delist', 'mark_sold')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  payload JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.automation_tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own tasks"
  ON public.automation_tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks"
  ON public.automation_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
  ON public.automation_tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
  ON public.automation_tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Index for efficient polling
CREATE INDEX idx_automation_tasks_pending ON public.automation_tasks(user_id, status) WHERE status = 'pending';