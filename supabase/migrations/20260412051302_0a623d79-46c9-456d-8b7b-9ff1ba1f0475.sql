
-- Add 'employee' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'employee';

-- Add must_change_password flag to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;

-- Create task status enum
CREATE TYPE public.task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- Create task priority enum
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Create employee_tasks table
CREATE TABLE public.employee_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  assigned_to uuid NOT NULL,
  assigned_by uuid NOT NULL,
  status public.task_status NOT NULL DEFAULT 'pending',
  priority public.task_priority NOT NULL DEFAULT 'medium',
  due_date date,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employee_tasks ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage all tasks"
ON public.employee_tasks
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Employees can view their assigned tasks
CREATE POLICY "Employees can view assigned tasks"
ON public.employee_tasks
FOR SELECT
TO authenticated
USING (auth.uid() = assigned_to);

-- Employees can update their own task status/notes
CREATE POLICY "Employees can update their tasks"
ON public.employee_tasks
FOR UPDATE
TO authenticated
USING (auth.uid() = assigned_to)
WITH CHECK (auth.uid() = assigned_to);

-- Auto-update updated_at
CREATE TRIGGER update_employee_tasks_updated_at
BEFORE UPDATE ON public.employee_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
