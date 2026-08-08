import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listRepository,
  listFolders,
  deleteResource,
  renameResource,
  moveResources,
  uploadMany,
  addDraftFolder,
  removeDraftFolder,
  type RepositoryItem,
  type UploadOptions,
} from '@/lib/resourceRepository';

export const RESOURCES_KEY = ['resource-repository'] as const;

/**
 * One cached source of truth for the resource repository.
 * Every page that reads or writes resources uses this hook, so uploads on one
 * screen show up instantly everywhere else without a refetch round-trip.
 */
export function useResources() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: RESOURCES_KEY,
    queryFn: () => listRepository(),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  });

  const items = useMemo(() => query.data ?? [], [query.data]);
  const folders = useMemo(() => listFolders(items), [items]);

  const push = useCallback(
    (added: RepositoryItem[]) => {
      if (!added.length) return;
      qc.setQueryData<RepositoryItem[]>(RESOURCES_KEY, (prev) => [...added, ...(prev ?? [])]);
    },
    [qc],
  );

  const upload = useMutation({
    mutationFn: async ({ files, ...base }: { files: File[] } & Omit<UploadOptions, 'file'>) =>
      uploadMany(files, base),
    onSuccess: ({ uploaded }) => {
      push(uploaded);
      uploaded.forEach((i) => removeDraftFolder(i.folder_path));
    },
  });

  const remove = useMutation({
    mutationFn: (item: RepositoryItem) => deleteResource(item),
    onMutate: (item) => {
      qc.setQueryData<RepositoryItem[]>(RESOURCES_KEY, (prev) =>
        (prev ?? []).filter((i) => i.id !== item.id),
      );
    },
    onError: () => qc.invalidateQueries({ queryKey: RESOURCES_KEY }),
  });

  const rename = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => renameResource(id, title),
    onMutate: ({ id, title }) => {
      qc.setQueryData<RepositoryItem[]>(RESOURCES_KEY, (prev) =>
        (prev ?? []).map((i) => (i.id === id ? { ...i, title } : i)),
      );
    },
    onError: () => qc.invalidateQueries({ queryKey: RESOURCES_KEY }),
  });

  const move = useMutation({
    mutationFn: ({ ids, folderPath }: { ids: string[]; folderPath: string }) =>
      moveResources(ids, folderPath),
    onMutate: ({ ids, folderPath }) => {
      qc.setQueryData<RepositoryItem[]>(RESOURCES_KEY, (prev) =>
        (prev ?? []).map((i) => (ids.includes(i.id) ? { ...i, folder_path: folderPath } : i)),
      );
    },
    onError: () => qc.invalidateQueries({ queryKey: RESOURCES_KEY }),
  });

  const createFolder = useCallback(
    (name: string) => {
      const folder = addDraftFolder(name);
      if (folder) qc.setQueryData<RepositoryItem[]>(RESOURCES_KEY, (prev) => [...(prev ?? [])]);
      return folder;
    },
    [qc],
  );

  return {
    items,
    folders,
    loading: query.isLoading,
    error: query.isError,
    refresh: () => qc.invalidateQueries({ queryKey: RESOURCES_KEY }),
    upload,
    remove,
    rename,
    move,
    createFolder,
  };
}
