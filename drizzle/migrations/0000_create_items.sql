CREATE TABLE public.items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  collection text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.items TO authenticated;
GRANT ALL ON public.items TO service_role;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.items FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.items FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX items_user_coll ON public.items(user_id, collection);