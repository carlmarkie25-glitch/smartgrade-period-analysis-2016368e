-- Create sponsor_class_assignments table
CREATE TABLE public.sponsor_class_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    assigned_by UUID REFERENCES public.profiles(id),
    UNIQUE(user_id, class_id)
);

ALTER TABLE public.sponsor_class_assignments ENABLE ROW LEVEL SECURITY;

-- Create index for performance
CREATE INDEX idx_sponsor_class_user_id ON public.sponsor_class_assignments(user_id);
CREATE INDEX idx_sponsor_class_class_id ON public.sponsor_class_assignments(class_id);

-- RLS Policy: Sponsors can only see their own assignments, admins can see all
CREATE POLICY sponsor_class_assignments_select ON public.sponsor_class_assignments
    FOR SELECT
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- RLS Policy: Only admins can insert, update, delete
CREATE POLICY sponsor_class_assignments_insert ON public.sponsor_class_assignments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY sponsor_class_assignments_delete ON public.sponsor_class_assignments
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );
