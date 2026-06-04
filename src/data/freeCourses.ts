// Curated free courses from Harvard, MIT, Stanford, YC, freeCodeCamp, Khan Academy, etc.
// Lessons reference YouTube video IDs so they play inside Edu Zambia (/watch/:videoId).

export type CourseTrack = 'developer' | 'entrepreneur' | 'healthcare' | 'skills';

export interface CourseLesson {
  title: string;
  videoId: string; // YouTube ID — opens in /watch/:videoId
  duration?: string;
}

export interface FreeCourse {
  id: string;
  track: CourseTrack;
  title: string;
  provider: string;       // Harvard, MIT, Stanford, freeCodeCamp, YC, Khan Academy, Yale
  instructor?: string;
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  hours: number;
  thumbnail: string;      // ytimg url
  externalUrl?: string;   // official course site
  lessons: CourseLesson[];
  tags: string[];
}

const yt = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

export const FREE_COURSES: FreeCourse[] = [
  // ───── DEVELOPER / HACKER ─────
  {
    id: 'cs50x',
    track: 'developer',
    title: 'CS50: Introduction to Computer Science',
    provider: 'Harvard University',
    instructor: 'David J. Malan',
    description: "Harvard's legendary intro to computer science — C, Python, SQL, web dev, security and AI.",
    level: 'Beginner',
    hours: 100,
    thumbnail: yt('LfaMVlDaQ24'),
    externalUrl: 'https://cs50.harvard.edu/x/',
    tags: ['computer-science', 'python', 'c', 'sql', 'web'],
    lessons: [
      { title: 'Lecture 0 — Scratch', videoId: 'LfaMVlDaQ24' },
      { title: 'Lecture 1 — C', videoId: 'cwtpLIWylAw' },
      { title: 'Lecture 2 — Arrays', videoId: 'cZ4pcMcuTW8' },
      { title: 'Lecture 3 — Algorithms', videoId: 'jZzyERW7h1A' },
      { title: 'Lecture 4 — Memory', videoId: 'lzh4xpJCMG0' },
      { title: 'Lecture 5 — Data Structures', videoId: 'rL8X8mB9bs0' },
      { title: 'Lecture 6 — Python', videoId: 'EqQAnEu1cE0' },
      { title: 'Lecture 7 — SQL', videoId: 'AaCnbOuwYUI' },
      { title: 'Lecture 8 — HTML, CSS, JS', videoId: 'tHvxjlW9be0' },
      { title: 'Lecture 9 — Flask', videoId: 'BAiZyZ_FxvY' },
      { title: 'Lecture 10 — Emoji & Ethics', videoId: 'qzMW9rh6JOs' },
    ],
  },
  {
    id: 'cs50ai',
    track: 'developer',
    title: 'CS50: Introduction to AI with Python',
    provider: 'Harvard University',
    instructor: 'Brian Yu',
    description: 'Search, knowledge, uncertainty, optimization, machine learning, neural networks and language.',
    level: 'Intermediate',
    hours: 35,
    thumbnail: yt('5NgNicANyqM'),
    externalUrl: 'https://cs50.harvard.edu/ai/',
    tags: ['ai', 'python', 'machine-learning'],
    lessons: [
      { title: 'Lecture 0 — Search', videoId: '5NgNicANyqM' },
      { title: 'Lecture 1 — Knowledge', videoId: 'HWQLez87vqM' },
      { title: 'Lecture 2 — Uncertainty', videoId: 'D8RRq3TbtHU' },
      { title: 'Lecture 3 — Optimization', videoId: 'qK46ET1xk2A' },
      { title: 'Lecture 4 — Learning', videoId: '-g0iJjnO2_w' },
      { title: 'Lecture 5 — Neural Networks', videoId: 'J1QD9hLDEDY' },
      { title: 'Lecture 6 — Language', videoId: 'QAZc9xsQNjQ' },
    ],
  },
  {
    id: 'fcc-python',
    track: 'developer',
    title: 'Python for Beginners — Full Course',
    provider: 'freeCodeCamp',
    instructor: 'Dr. Chuck / Mosh',
    description: '4-hour beginner-to-confident Python crash course with projects.',
    level: 'Beginner',
    hours: 4,
    thumbnail: yt('_uQrJ0TkZlc'),
    externalUrl: 'https://www.freecodecamp.org/learn',
    tags: ['python'],
    lessons: [
      { title: 'Python Full Course (Mosh)', videoId: '_uQrJ0TkZlc' },
      { title: 'Python for Everybody (Dr. Chuck)', videoId: '8DvywoWv6fI' },
    ],
  },
  {
    id: 'fcc-webdev',
    track: 'developer',
    title: 'Full-Stack Web Development',
    provider: 'freeCodeCamp',
    description: 'HTML, CSS, JavaScript, React, Node.js, and databases — build real apps end-to-end.',
    level: 'Beginner',
    hours: 30,
    thumbnail: yt('mU6anWqZJcc'),
    externalUrl: 'https://www.freecodecamp.org/',
    tags: ['html', 'css', 'javascript', 'react', 'node'],
    lessons: [
      { title: 'HTML Full Course', videoId: 'kUMe1FH4CHE' },
      { title: 'CSS Full Course', videoId: '1Rs2ND1ryYc' },
      { title: 'JavaScript Full Course', videoId: 'jS4aFq5-91M' },
      { title: 'React Full Course', videoId: 'bMknfKXIFA8' },
      { title: 'Node.js Full Course', videoId: 'Oe421EPjeBE' },
    ],
  },
  {
    id: 'mit-algos',
    track: 'developer',
    title: 'MIT 6.006 — Introduction to Algorithms',
    provider: 'MIT OpenCourseWare',
    instructor: 'Erik Demaine',
    description: 'Algorithmic thinking — sorting, hashing, graphs, dynamic programming.',
    level: 'Advanced',
    hours: 40,
    thumbnail: yt('ZA-tUyM_y7s'),
    externalUrl: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/',
    tags: ['algorithms', 'data-structures'],
    lessons: [
      { title: 'Lecture 1 — Algorithms & Computation', videoId: 'ZA-tUyM_y7s' },
      { title: 'Lecture 2 — Data Structures', videoId: 'CHhwJjR0mZA' },
      { title: 'Lecture 3 — Sorting', videoId: 'Nz1KZXbghj8' },
    ],
  },

  // ───── ENTREPRENEUR ─────
  {
    id: 'yc-startup-school',
    track: 'entrepreneur',
    title: 'Y Combinator Startup School',
    provider: 'Y Combinator',
    instructor: 'Sam Altman, Paul Graham et al.',
    description: 'The complete free YC playbook — ideas, building, growth, fundraising.',
    level: 'Beginner',
    hours: 20,
    thumbnail: yt('CBYhVcO4WgI'),
    externalUrl: 'https://www.startupschool.org/',
    tags: ['startup', 'fundraising'],
    lessons: [
      { title: 'How to Start a Startup — Sam Altman', videoId: 'CBYhVcO4WgI' },
      { title: 'How to Get Startup Ideas — Paul Graham', videoId: 'CKtIxRYOXyk' },
      { title: 'How to Build Products Users Love', videoId: 'sz_LgBAGYyo' },
      { title: 'Growth — Alex Schultz', videoId: 'n_yHZ_vKjno' },
      { title: 'How to Raise Money — Marc Andreessen', videoId: 'fdpERrv4mWs' },
      { title: 'How to Hire — Patrick & John Collison', videoId: 'cVB-71YhKDY' },
    ],
  },
  {
    id: 'stanford-ecorner',
    track: 'entrepreneur',
    title: 'Stanford eCorner — Entrepreneurial Thought Leaders',
    provider: 'Stanford University',
    description: "Talks from founders & CEOs on building companies. Curated from Stanford's free archive.",
    level: 'Intermediate',
    hours: 15,
    thumbnail: yt('ZoqgAy3h4OM'),
    externalUrl: 'https://ecorner.stanford.edu/',
    tags: ['leadership', 'startup'],
    lessons: [
      { title: 'Elon Musk — The Future', videoId: 'ZoqgAy3h4OM' },
      { title: 'Reid Hoffman — Network Effects', videoId: 'agyL5gJW1pY' },
      { title: 'Brian Chesky — Airbnb Story', videoId: 'W608u6sBFpo' },
    ],
  },
  {
    id: 'harvard-emerging',
    track: 'entrepreneur',
    title: 'Entrepreneurship in Emerging Economies',
    provider: 'Harvard (edX, free audit)',
    instructor: 'Tarun Khanna',
    description: 'How to identify problems & build ventures in Africa, South Asia and emerging markets.',
    level: 'Intermediate',
    hours: 24,
    thumbnail: yt('K9ZDDeJxX3Y'),
    externalUrl: 'https://www.edx.org/learn/entrepreneurship/harvard-university-entrepreneurship-in-emerging-economies',
    tags: ['emerging-markets', 'africa'],
    lessons: [
      { title: 'Course Intro — Tarun Khanna', videoId: 'K9ZDDeJxX3Y' },
      { title: 'Institutional Voids', videoId: 'bU9wWk2vR-A' },
    ],
  },
  {
    id: 'lean-startup',
    track: 'entrepreneur',
    title: 'The Lean Startup Method',
    provider: 'Eric Ries / Stanford',
    description: 'Build-measure-learn, MVPs, validated learning and pivots.',
    level: 'Beginner',
    hours: 6,
    thumbnail: yt('fEvKo90qW3w'),
    tags: ['lean', 'mvp'],
    lessons: [
      { title: 'Eric Ries — Lean Startup at Stanford', videoId: 'fEvKo90qW3w' },
      { title: 'How to Build an MVP', videoId: '1FoCbbbcYT8' },
    ],
  },

  // ───── HEALTHCARE ─────
  {
    id: 'khan-medicine',
    track: 'healthcare',
    title: 'Khan Academy — Health & Medicine',
    provider: 'Khan Academy',
    description: 'Comprehensive free medicine — anatomy, physiology, pathology, pharmacology.',
    level: 'Beginner',
    hours: 60,
    thumbnail: yt('JRJoVjpFsRY'),
    externalUrl: 'https://www.khanacademy.org/science/health-and-medicine',
    tags: ['anatomy', 'physiology'],
    lessons: [
      { title: 'Anatomy of the Heart', videoId: 'JRJoVjpFsRY' },
      { title: 'Respiratory System', videoId: 'Cqt4LjHnMEA' },
      { title: 'Nervous System', videoId: 'qPix_X-9t7E' },
      { title: 'Renal Physiology', videoId: 'cc8sUv2SuaY' },
    ],
  },
  {
    id: 'harvard-neuroscience',
    track: 'healthcare',
    title: 'Fundamentals of Neuroscience',
    provider: 'Harvard University',
    instructor: 'David Cox',
    description: 'How neurons work, build a brain from the ground up — free edX audit.',
    level: 'Intermediate',
    hours: 30,
    thumbnail: yt('vyNkAuX29OU'),
    externalUrl: 'https://www.mcb80x.org/',
    tags: ['neuroscience', 'brain'],
    lessons: [
      { title: 'Intro — The Electrical Action Potential', videoId: 'vyNkAuX29OU' },
      { title: 'The Synapse', videoId: 'WhowH0kb7n0' },
    ],
  },
  {
    id: 'yale-wellbeing',
    track: 'healthcare',
    title: 'The Science of Well-Being',
    provider: 'Yale University',
    instructor: 'Laurie Santos',
    description: "Yale's most popular course — evidence-based practices for mental health & happiness.",
    level: 'Beginner',
    hours: 19,
    thumbnail: yt('ZizdB0TgAVM'),
    externalUrl: 'https://www.coursera.org/learn/the-science-of-well-being',
    tags: ['mental-health', 'psychology'],
    lessons: [
      { title: 'Misconceptions about Happiness', videoId: 'ZizdB0TgAVM' },
      { title: 'Why Our Expectations Are So Bad', videoId: '4q1dgn_C0AU' },
    ],
  },
  {
    id: 'who-frontline',
    track: 'healthcare',
    title: 'WHO Open — Frontline Health',
    provider: 'World Health Organization',
    description: 'Free WHO modules on infection prevention, maternal care, emergency response.',
    level: 'Beginner',
    hours: 12,
    thumbnail: yt('1APwq1df6Mw'),
    externalUrl: 'https://openwho.org/',
    tags: ['public-health'],
    lessons: [
      { title: 'Infection Prevention Basics', videoId: '1APwq1df6Mw' },
      { title: 'Hand Hygiene Technique', videoId: 'IisgnbMfKvI' },
    ],
  },

  // ───── SKILLS DEVELOPMENT ─────
  {
    id: 'learning-how-to-learn',
    track: 'skills',
    title: 'Learning How to Learn',
    provider: 'McMaster / UC San Diego',
    instructor: 'Barbara Oakley',
    description: "World's most popular online course — science-backed techniques to master anything faster.",
    level: 'Beginner',
    hours: 15,
    thumbnail: yt('O96fE1E-rf8'),
    externalUrl: 'https://www.coursera.org/learn/learning-how-to-learn',
    tags: ['study-skills', 'memory'],
    lessons: [
      { title: 'Focused vs Diffuse Thinking', videoId: 'O96fE1E-rf8' },
      { title: 'Beating Procrastination', videoId: 'LbDLW32srSk' },
      { title: 'Memory Techniques', videoId: 'BlRQCnsGyrM' },
    ],
  },
  {
    id: 'google-digital',
    track: 'skills',
    title: 'Google Digital Skills for Africa',
    provider: 'Google',
    description: 'Career-ready digital marketing, productivity and data fundamentals.',
    level: 'Beginner',
    hours: 40,
    thumbnail: yt('ke90Tje7VS0'),
    externalUrl: 'https://learndigital.withgoogle.com/digitalskills',
    tags: ['digital-skills', 'marketing'],
    lessons: [
      { title: 'Fundamentals of Digital Marketing', videoId: 'ke90Tje7VS0' },
      { title: 'Build Your Online Presence', videoId: '2WW7HCEd-IY' },
    ],
  },
  {
    id: 'fcc-data-analysis',
    track: 'skills',
    title: 'Data Analysis with Python',
    provider: 'freeCodeCamp',
    description: 'Pandas, NumPy, statistics & visualization — become job-ready as a data analyst.',
    level: 'Intermediate',
    hours: 10,
    thumbnail: yt('r-uOLxNrNk8'),
    externalUrl: 'https://www.freecodecamp.org/learn/data-analysis-with-python/',
    tags: ['data', 'python', 'pandas'],
    lessons: [
      { title: 'Data Analysis with Python — Full Course', videoId: 'r-uOLxNrNk8' },
      { title: 'Pandas Tutorial', videoId: 'vmEHCJofslg' },
    ],
  },
  {
    id: 'harvard-public-speaking',
    track: 'skills',
    title: 'Public Speaking & Communication',
    provider: 'Harvard / TED',
    description: 'Craft talks people remember — structure, delivery, presence.',
    level: 'Beginner',
    hours: 6,
    thumbnail: yt('Iwpi1Lm6dFo'),
    tags: ['communication', 'public-speaking'],
    lessons: [
      { title: 'Speak Like a Leader — Simon Lancaster', videoId: 'Iwpi1Lm6dFo' },
      { title: 'How to Speak — Patrick Winston (MIT)', videoId: 'Unzc731iCUY' },
    ],
  },
];

export const TRACK_META: Record<CourseTrack, { label: string; emoji: string; tagline: string }> = {
  developer:    { label: 'Developers & Hackers', emoji: '💻', tagline: 'CS50, MIT, freeCodeCamp — build software & ship.' },
  entrepreneur: { label: 'Entrepreneurs',         emoji: '🚀', tagline: 'YC, Stanford, Harvard — start and scale ventures.' },
  healthcare:   { label: 'Healthcare Workers',    emoji: '🩺', tagline: 'Harvard, Yale, WHO, Khan — clinical & well-being.' },
  skills:       { label: 'Skills Development',    emoji: '🌱', tagline: 'Learn how to learn, data, digital & communication.' },
};
