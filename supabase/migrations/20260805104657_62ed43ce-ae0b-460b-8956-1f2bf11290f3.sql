-- Shared library bucket: everyone signed in can read, owners manage their own folder
CREATE POLICY "Shared library readable by signed-in users"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'shared-library');

CREATE POLICY "Users upload into their own shared library folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'shared-library' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users update their own shared library files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'shared-library' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete their own shared library files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'shared-library' AND (storage.foldername(name))[1] = auth.uid()::text);