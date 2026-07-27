import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  GraduationCap, School, Target, User, Calendar, Sparkles,
  ChevronRight, ChevronLeft, CheckCircle2, BookOpen, Briefcase, Globe2,
} from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { toast } from '@/hooks/use-toast';

const ZAMBIAN_PROVINCES = [
  'Central','Copperbelt','Eastern','Luapula','Lusaka','Muchinga','Northern','North-Western','Southern','Western',
];

const EDUCATION_LEVELS = [
  { value: 'primary',   label: 'Primary School',          desc: 'Grades 1–7 (ECZ)',           icon: '📚' },
  { value: 'secondary', label: 'Secondary School',        desc: 'Grades 8–12 (ECZ)',          icon: '🎓' },
  { value: 'college',   label: 'College',                  desc: 'Diploma / Certificate',      icon: '🏫' },
  { value: 'university',label: 'University',               desc: 'Degree / Postgraduate',      icon: '🎓' },
  { value: 'tvet',      label: 'TVET / Skills Training',  desc: 'Vocational & trades',        icon: '🛠️' },
  { value: 'adult',     label: 'Adult / Lifelong Learner',desc: 'Self-directed learning',     icon: '🌱' },
];

const PRIMARY_GRADES   = ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7'];
const SECONDARY_GRADES = ['Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'];
const COLLEGE_YEARS    = ['Year 1','Year 2','Year 3','Year 4','Year 5','Year 6'];

const LEARNING_STYLES = [
  { value: 'visual',      label: 'Visual',      desc: 'Pictures, diagrams, videos' },
  { value: 'auditory',    label: 'Auditory',    desc: 'Listening & discussion' },
  { value: 'reading',     label: 'Reading',     desc: 'Notes & textbooks' },
  { value: 'kinesthetic', label: 'Hands-on',    desc: 'Practice & doing' },
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'bem', label: 'Bemba' },
  { value: 'nya', label: 'Nyanja' },
  { value: 'toi', label: 'Tonga' },
  { value: 'loz', label: 'Lozi' },
];

const STEPS = [
  { id: 'level',    icon: GraduationCap, title: 'Education Level' },
  { id: 'institution', icon: School,     title: 'Institution' },
  { id: 'personal', icon: User,           title: 'About You' },
  { id: 'goals',    icon: Target,         title: 'Goals' },
  { id: 'done',     icon: Sparkles,       title: 'Done' },
];

interface Props { onComplete: () => void }

export const StudentOnboardingWizard: React.FC<Props> = ({ onComplete }) => {
  const { profile, updateProfile } = useProfile();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Form state
  const [educationLevel, setEducationLevel] = useState<string>('');
  const [institutionType, setInstitutionType] = useState<string>('');
  const [institutionName, setInstitutionName] = useState('');
  const [program, setProgram] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [grade, setGrade] = useState('');
  const [province, setProvince] = useState('');

  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [guardianContact, setGuardianContact] = useState('');
  const [language, setLanguage] = useState('en');
  const [learningStyle, setLearningStyle] = useState('');

  const [subjectsInput, setSubjectsInput] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [examTarget, setExamTarget] = useState('');
  const [examYear, setExamYear] = useState<string>('');
  const [careerInterest, setCareerInterest] = useState('');
  const [studyGoals, setStudyGoals] = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setProvince(profile.province || '');
      setPhone(profile.phone || '');
      setEducationLevel(profile.education_level || '');
      setInstitutionType(profile.institution_type || '');
      setInstitutionName(profile.institution_name || profile.school || '');
      setProgram(profile.program_of_study || '');
      setYearOfStudy(profile.year_of_study || '');
      setGrade(profile.grade || '');
      setDob(profile.date_of_birth || '');
      setGuardianContact(profile.guardian_contact || '');
      setLanguage(profile.preferred_language || 'en');
      setLearningStyle(profile.learning_style || '');
      setSubjects(profile.subjects || []);
      setExamTarget(profile.exam_target || '');
      setExamYear(profile.exam_year ? String(profile.exam_year) : '');
      setCareerInterest(profile.career_interest || '');
      setStudyGoals(profile.study_goals || '');
    }
  }, [profile?.id]);

  const addSubject = () => {
    const v = subjectsInput.trim();
    if (v && !subjects.includes(v)) setSubjects([...subjects, v]);
    setSubjectsInput('');
  };

  const isMinor = dob ? (new Date().getFullYear() - new Date(dob).getFullYear()) < 18 : false;

  const inferInstitutionType = (lvl: string) => {
    if (lvl === 'primary' || lvl === 'secondary') return 'school';
    if (lvl === 'college') return 'college';
    if (lvl === 'university') return 'university';
    if (lvl === 'tvet') return 'tvet';
    return 'self';
  };

  const handleNext = async () => {
    // Step validations
    if (step === 0 && !educationLevel) {
      toast({ title: 'Pick a level', description: 'Choose your current education level.', variant: 'destructive' });
      return;
    }
    if (step === 1 && educationLevel !== 'adult' && !institutionName.trim()) {
      toast({ title: 'Institution required', variant: 'destructive' });
      return;
    }
    if (step === 2 && !fullName.trim()) {
      toast({ title: 'Name required', variant: 'destructive' });
      return;
    }
    if (step === 3) {
      // Save everything
      setSaving(true);
      const result = await updateProfile({
        full_name: fullName,
        phone,
        province,
        school: institutionName,
        grade: grade || yearOfStudy || null,
        education_level: educationLevel,
        institution_type: institutionType || inferInstitutionType(educationLevel),
        institution_name: institutionName,
        program_of_study: program || null,
        year_of_study: yearOfStudy || null,
        date_of_birth: dob || null,
        guardian_contact: guardianContact || null,
        preferred_language: language,
        learning_style: learningStyle || null,
        subjects,
        exam_target: examTarget || null,
        exam_year: examYear ? parseInt(examYear, 10) : null,
        career_interest: careerInterest || null,
        study_goals: studyGoals || null,
        device_setup_complete: true,
      });
      setSaving(false);
      if (!result.success) {
        toast({ title: 'Could not save', variant: 'destructive' });
        return;
      }
      toast({ title: 'Profile saved! 🎉' });
    }
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => setStep(s => Math.max(0, s - 1));

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Welcome to Synapse</h1>
        <p className="text-muted-foreground">Let's set up your learning profile in a minute</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex-1 flex items-center gap-1">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
              i < step ? 'bg-primary text-primary-foreground' :
              i === step ? 'bg-primary/20 text-primary border-2 border-primary' :
              'bg-muted text-muted-foreground'
            }`}>
              {i < step ? <CheckCircle2 className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-1 rounded ${i < step ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
          <Card>
            <CardContent className="p-6 md:p-8 space-y-6">
              {/* STEP 0 — Level */}
              {step === 0 && (
                <>
                  <div className="text-center space-y-2">
                    <GraduationCap className="w-12 h-12 text-primary mx-auto" />
                    <h2 className="text-2xl font-bold">What level are you at?</h2>
                    <p className="text-sm text-muted-foreground">We'll tailor content to your education stage.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {EDUCATION_LEVELS.map(lvl => (
                      <button
                        key={lvl.value}
                        type="button"
                        onClick={() => { setEducationLevel(lvl.value); setInstitutionType(inferInstitutionType(lvl.value)); }}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                          educationLevel === lvl.value ? 'border-primary bg-primary/5 shadow-md' : 'border-border hover:border-primary/40 hover:bg-accent/30'
                        }`}
                      >
                        <span className="text-2xl">{lvl.icon}</span>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{lvl.label}</p>
                          <p className="text-xs text-muted-foreground">{lvl.desc}</p>
                        </div>
                        {educationLevel === lvl.value && <CheckCircle2 className="w-5 h-5 text-primary" />}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* STEP 1 — Institution */}
              {step === 1 && (
                <>
                  <div className="text-center space-y-2">
                    <School className="w-12 h-12 text-primary mx-auto" />
                    <h2 className="text-2xl font-bold">Your Institution</h2>
                    <p className="text-sm text-muted-foreground">
                      {educationLevel === 'adult' ? 'Optional — you can skip this step.' : 'Tell us where you study.'}
                    </p>
                  </div>
                  <div className="space-y-4 max-w-md mx-auto">
                    {educationLevel !== 'adult' && (
                      <div>
                        <Label>Institution Name *</Label>
                        <Input value={institutionName} onChange={e => setInstitutionName(e.target.value)} placeholder="e.g., Lusaka Boys Secondary / UNZA / NORTEC" />
                      </div>
                    )}

                    {(educationLevel === 'primary' || educationLevel === 'secondary') && (
                      <div>
                        <Label>Grade</Label>
                        <Select value={grade} onValueChange={setGrade}>
                          <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                          <SelectContent>
                            {(educationLevel === 'primary' ? PRIMARY_GRADES : SECONDARY_GRADES).map(g =>
                              <SelectItem key={g} value={g}>{g}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {(educationLevel === 'college' || educationLevel === 'university' || educationLevel === 'tvet') && (
                      <>
                        <div>
                          <Label>Program of Study</Label>
                          <Input value={program} onChange={e => setProgram(e.target.value)} placeholder="e.g., BSc Computer Science / Diploma in Nursing" />
                        </div>
                        <div>
                          <Label>Year of Study</Label>
                          <Select value={yearOfStudy} onValueChange={setYearOfStudy}>
                            <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                            <SelectContent>{COLLEGE_YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </>
                    )}

                    <div>
                      <Label>Province</Label>
                      <Select value={province} onValueChange={setProvince}>
                        <SelectTrigger><SelectValue placeholder="Select province" /></SelectTrigger>
                        <SelectContent>{ZAMBIAN_PROVINCES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              {/* STEP 2 — Personal */}
              {step === 2 && (
                <>
                  <div className="text-center space-y-2">
                    <User className="w-12 h-12 text-primary mx-auto" />
                    <h2 className="text-2xl font-bold">About You</h2>
                    <p className="text-sm text-muted-foreground">Personalise your learning experience.</p>
                  </div>
                  <div className="space-y-4 max-w-md mx-auto">
                    <div>
                      <Label>Full Name *</Label>
                      <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g., Mwila Chanda" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Date of Birth</Label>
                        <Input type="date" value={dob} onChange={e => setDob(e.target.value)} />
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+260..." />
                      </div>
                    </div>
                    {isMinor && (
                      <div>
                        <Label>Guardian Contact (required for under 18)</Label>
                        <Input value={guardianContact} onChange={e => setGuardianContact(e.target.value)} placeholder="Parent's phone or email" />
                      </div>
                    )}
                    <div>
                      <Label className="flex items-center gap-2"><Globe2 className="w-4 h-4" /> Preferred Language</Label>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Learning Style</Label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        {LEARNING_STYLES.map(ls => (
                          <button key={ls.value} type="button" onClick={() => setLearningStyle(ls.value)}
                            className={`p-2.5 rounded-lg border-2 text-left text-xs transition-all ${
                              learningStyle === ls.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                            }`}>
                            <p className="font-semibold">{ls.label}</p>
                            <p className="text-[11px] text-muted-foreground">{ls.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* STEP 3 — Goals */}
              {step === 3 && (
                <>
                  <div className="text-center space-y-2">
                    <Target className="w-12 h-12 text-primary mx-auto" />
                    <h2 className="text-2xl font-bold">Your Goals</h2>
                    <p className="text-sm text-muted-foreground">What do you want to achieve?</p>
                  </div>
                  <div className="space-y-4 max-w-md mx-auto">
                    <div>
                      <Label className="flex items-center gap-2"><BookOpen className="w-4 h-4" /> Subjects / Courses</Label>
                      <div className="flex gap-2">
                        <Input value={subjectsInput} onChange={e => setSubjectsInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSubject())}
                          placeholder="e.g., Mathematics" />
                        <Button type="button" variant="secondary" onClick={addSubject}>Add</Button>
                      </div>
                      {subjects.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {subjects.map(s => (
                            <Badge key={s} variant="secondary" className="cursor-pointer" onClick={() => setSubjects(subjects.filter(x => x !== s))}>
                              {s} ✕
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {(educationLevel === 'secondary' || educationLevel === 'primary') && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Exam Target</Label>
                          <Select value={examTarget} onValueChange={setExamTarget}>
                            <SelectTrigger><SelectValue placeholder="ECZ exam" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="grade7">Grade 7 ECZ</SelectItem>
                              <SelectItem value="grade9">Grade 9 ECZ</SelectItem>
                              <SelectItem value="grade12">Grade 12 ECZ</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Exam Year</Label>
                          <Input type="number" min="2025" max="2035" value={examYear} onChange={e => setExamYear(e.target.value)} placeholder="2026" />
                        </div>
                      </div>
                    )}

                    <div>
                      <Label className="flex items-center gap-2"><Briefcase className="w-4 h-4" /> Career Interest</Label>
                      <Input value={careerInterest} onChange={e => setCareerInterest(e.target.value)} placeholder="e.g., Doctor, Engineer, Entrepreneur" />
                    </div>
                    <div>
                      <Label>Study Goals</Label>
                      <Textarea value={studyGoals} onChange={e => setStudyGoals(e.target.value)} placeholder="What do you want to achieve this term?" rows={3} />
                    </div>
                  </div>
                </>
              )}

              {/* STEP 4 — Done */}
              {step === 4 && (
                <div className="text-center space-y-6 py-4">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                    <Sparkles className="w-20 h-20 text-primary mx-auto" />
                  </motion.div>
                  <h2 className="text-3xl font-bold">You're All Set! 🎉</h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Your personalised dashboard is ready. Let's start learning.
                  </p>
                  <Button size="lg" className="text-lg h-14 px-8" onClick={onComplete}>
                    Go to Dashboard <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              )}

              {/* Nav */}
              {step < 4 && (
                <div className="flex items-center justify-between pt-2">
                  <Button variant="ghost" onClick={handleBack} disabled={step === 0}>
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <Button onClick={handleNext} disabled={saving}>
                    {step === 3 ? (saving ? 'Saving...' : 'Finish') : 'Next'}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default StudentOnboardingWizard;
