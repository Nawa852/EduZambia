
CREATE POLICY "study own read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'study-resources' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "study own insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'study-resources' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "study own update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'study-resources' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "study own delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'study-resources' AND (storage.foldername(name))[1] = auth.uid()::text);
