-- Add new period types for exams and semester reports
ALTER TYPE public.period_type ADD VALUE IF NOT EXISTS 'exam_s1';
ALTER TYPE public.period_type ADD VALUE IF NOT EXISTS 'exam_s2';
ALTER TYPE public.period_type ADD VALUE IF NOT EXISTS 'semester1';
ALTER TYPE public.period_type ADD VALUE IF NOT EXISTS 'semester2';
ALTER TYPE public.period_type ADD VALUE IF NOT EXISTS 'yearly';