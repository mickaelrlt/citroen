GRANT SELECT, INSERT, DELETE ON public.items TO authenticated;
REVOKE UPDATE ON public.items FROM authenticated;
GRANT UPDATE (data) ON public.items TO authenticated;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shared direction select" ON public.items FOR SELECT TO authenticated USING (collection = 'direction');
CREATE POLICY "Shared direction update" ON public.items FOR UPDATE TO authenticated USING (collection = 'direction') WITH CHECK (collection = 'direction');
CREATE POLICY "Shared direction delete" ON public.items FOR DELETE TO authenticated USING (collection = 'direction');
ALTER PUBLICATION supabase_realtime ADD TABLE public.items;