import React, { useEffect, useMemo, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  listSubjects, listTopics, listCompetences, gradeLabel,
  type CurriculumSubject, type CurriculumTopic, type CurriculumCompetence,
} from '@/lib/curriculum';

export interface CurriculumSelection {
  grade: string;
  subject: CurriculumSubject | null;
  topic: CurriculumTopic | null;
  competence: CurriculumCompetence | null;
  topics: CurriculumTopic[];
  competences: CurriculumCompetence[];
}

interface Props {
  onChange: (s: CurriculumSelection) => void;
  /** Stop at topic level (e.g. schemes of work). */
  depth?: 'topic' | 'competence';
  className?: string;
}

/** Cascading curriculum selection with explicit verification status. */
export const CurriculumPicker: React.FC<Props> = ({ onChange, depth = 'competence', className }) => {
  const [subjects, setSubjects] = useState<CurriculumSubject[]>([]);
  const [grade, setGrade] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [topics, setTopics] = useState<CurriculumTopic[]>([]);
  const [topicId, setTopicId] = useState('');
  const [competences, setCompetences] = useState<CurriculumCompetence[]>([]);
  const [competenceId, setCompetenceId] = useState('');

  useEffect(() => { listSubjects().then(setSubjects).catch(() => setSubjects([])); }, []);

  const grades = useMemo(() => Array.from(new Set(subjects.map((s) => s.grade))), [subjects]);
  const gradeSubjects = subjects.filter((s) => s.grade === grade);
  const subject = subjects.find((s) => s.id === subjectId) ?? null;
  const topic = topics.find((t) => t.id === topicId) ?? null;
  const competence = competences.find((c) => c.id === competenceId) ?? null;

  useEffect(() => {
    setTopics([]); setTopicId(''); setCompetences([]); setCompetenceId('');
    if (!subjectId) return;
    listTopics(subjectId).then(async (t) => {
      setTopics(t);
      setCompetences(await listCompetences(t.map((x) => x.id)));
    }).catch(() => undefined);
  }, [subjectId]);

  useEffect(() => {
    onChange({ grade, subject, topic, competence, topics, competences });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grade, subjectId, topicId, competenceId, topics, competences]);

  const topicComps = competences.filter((c) => c.topic_id === topicId);

  return (
    <div className={`flex flex-wrap gap-2 max-w-full ${className ?? ''}`}>
      <Select value={grade} onValueChange={(v) => { setGrade(v); setSubjectId(''); }}>
        <SelectTrigger aria-label="Grade or form" className="h-10 w-32 max-w-full rounded-lg"><SelectValue placeholder="Grade" /></SelectTrigger>
        <SelectContent>{grades.map((g) => <SelectItem key={g} value={g}>{gradeLabel(g)}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={subjectId} onValueChange={setSubjectId} disabled={!grade}>
        <SelectTrigger aria-label="Subject" className="h-10 w-44 max-w-full rounded-lg"><SelectValue placeholder="Subject" /></SelectTrigger>
        <SelectContent>{gradeSubjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={topicId} onValueChange={(v) => { setTopicId(v); setCompetenceId(''); }} disabled={!topics.length}>
          <SelectTrigger aria-label="Topic" className="h-10 w-52 max-w-full rounded-lg"><SelectValue placeholder={subjectId && !topics.length ? 'No topics yet' : 'Topic'} /></SelectTrigger>
          <SelectContent>{topics.map((t) => <SelectItem key={t.id} value={t.id}>{t.code ? `${t.code} ` : ''}{t.title}</SelectItem>)}</SelectContent>
        </Select>
      {depth === 'competence' && (
        <Select value={competenceId} onValueChange={setCompetenceId} disabled={!topicComps.length}>
          <SelectTrigger aria-label="Specific competence" className="h-10 w-64 max-w-full rounded-lg"><SelectValue placeholder="Specific competence" /></SelectTrigger>
          <SelectContent>{topicComps.map((c) => <SelectItem key={c.id} value={c.id}>{c.code} · {c.title}</SelectItem>)}</SelectContent>
        </Select>
      )}
      {subject && <p className="w-full text-xs text-muted-foreground">{subject.verification_status === 'syllabus_verified' ? 'Syllabus verified' : 'Draft curriculum · awaiting syllabus verification'}{subject.syllabus_url && <> · <a className="text-primary underline" href={subject.syllabus_url} target="_blank" rel="noreferrer">Syllabus source</a></>}</p>}
    </div>
  );
};

export default CurriculumPicker;
