import type { ResourceKind } from './resourceRepository';

export type ResourceRole = 'student' | 'teacher' | 'guardian' | 'institution' | 'ministry' | string;

export interface ResourcePermissions {
  canUpload: boolean;
  canDelete: boolean;
  /** May mark a resource as visible to everyone in Synapse. */
  canShare: boolean;
  /** Copy of a sharing label that matches the role. */
  shareLabel: string;
  uploadHint: string;
  maxSizeMb: number;
  allowedKinds: ResourceKind[];
}

const ALL_KINDS: ResourceKind[] = ['pdf', 'document', 'slides', 'spreadsheet', 'image', 'video', 'audio', 'other'];

export function getResourcePermissions(role: ResourceRole): ResourcePermissions {
  switch (role) {
    case 'teacher':
      return {
        canUpload: true, canDelete: true, canShare: true,
        shareLabel: 'Publish to my learners',
        uploadHint: 'Upload lesson material, past papers and marking guides.',
        maxSizeMb: 100,
        allowedKinds: ALL_KINDS,
      };
    case 'institution':
    case 'ministry':
      return {
        canUpload: true, canDelete: true, canShare: true,
        shareLabel: 'Publish school-wide',
        uploadHint: 'Upload circulars, policies, timetables and school reports.',
        maxSizeMb: 100,
        allowedKinds: ALL_KINDS,
      };
    case 'guardian':
      return {
        canUpload: true, canDelete: true, canShare: false,
        shareLabel: 'Sharing is disabled for guardian accounts',
        uploadHint: 'Upload permission slips, receipts and reports for your child.',
        maxSizeMb: 25,
        allowedKinds: ['pdf', 'document', 'image', 'spreadsheet', 'other'],
      };
    default:
      return {
        canUpload: true, canDelete: true, canShare: false,
        shareLabel: 'Sharing is managed by your teacher',
        uploadHint: 'Upload notes, textbooks and past papers to study from.',
        maxSizeMb: 50,
        allowedKinds: ALL_KINDS,
      };
  }
}

export interface ValidationResult { ok: boolean; reason?: string }

export function validateFile(file: File, perms: ResourcePermissions, kind: ResourceKind): ValidationResult {
  if (file.size === 0) return { ok: false, reason: 'File is empty' };
  if (file.size > perms.maxSizeMb * 1024 * 1024) {
    return { ok: false, reason: `Larger than the ${perms.maxSizeMb}MB limit for your account` };
  }
  if (!perms.allowedKinds.includes(kind)) {
    return { ok: false, reason: `${kind} files are not allowed for your account type` };
  }
  return { ok: true };
}
