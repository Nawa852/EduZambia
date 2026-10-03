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

/** Cascading grade → subject → topic → competence from official curriculum data. Never free text. */
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
    <div className={`flex flex-wrap gap-2 ${className ?? ''}`}>
      <Select value={grade} onValueChange={(v) => { setGrade(v); setSubjectId(''); }}>
        <SelectTrigger className="h-9 w-32 rounded-full"><SelectValue placeholder="Grade" /></SelectTrigger>
        <SelectContent>{grades.map((g) => <SelectItem key={g} value={g}>{gradeLabel(g)}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={subjectId} onValueChange={setSubjectId} disabled={!grade}>
        <SelectTrigger className="h-9 w-44 rounded-full"><SelectValue placeholder="Subject" /></SelectTrigger>
        <SelectContent>{gradeSubjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={topicId} onValueChange={(v) => { setTopicId(v); setCompetenceId(''); }} disabled={!topics.length}>
          <SelectTrigger className="h-9 w-52 rounded-full"><SelectValue placeholder={subjectId && !topics.length ? 'No topics yet' : 'Topic'} /></SelectTrigger>
          <SelectContent>{topics.map((t) => <SelectItem key={t.id} value={t.id}>{t.code ? `${t.code} ` : ''}{t.title}</SelectItem>)}</SelectContent>
        </Select>
      {depth === 'competence' && (
        <Select value={competenceId} onValueChange={setCompetenceId} disabled={!topicComps.length}>
          <SelectTrigger className="h-9 w-64 rounded-full"><SelectValue placeholder="Specific competence" /></SelectTrigger>
          <SelectContent>{topicComps.map((c) => <SelectItem key={c.id} value={c.id}>{c.code} · {c.title}</SelectItem>)}</SelectContent>
        </Select>
      )}
    </div>
  );
};

export default CurriculumPicker;
