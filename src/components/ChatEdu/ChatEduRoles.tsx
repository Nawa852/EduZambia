import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, Users, Building, Globe, Heart,
  ArrowRight, Check, Sparkles, Brain, BookOpen,
  BarChart3, MessageSquare, Award, Target, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Role {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  gradient: string;
  description: string;
  features: string[];
  cta: string;
  popular?: boolean;
}

const roles: Role[] = [
  {
    id: 'student',
    title: 'For Students',
    subtitle: 'Learn smarter, not harder',
    icon: GraduationCap,
    gradient: 'from-blue-500 to-cyan-500',
    description: 'AI-powered learning that adapts to your pace. Get instant help with homework, prepare for ECZ exams, and track your progress.',
    features: [
      '24/7 AI tutor access',
      'ECZ exam preparation',
      'Personalized learning paths',
      'Progress tracking & analytics',
      'Offline study mode',
      'Gamified achievements'
    ],
    cta: 'Start Learning',
    popular: true
  },
  {
    id: 'teacher',
    title: 'For Teachers',
    subtitle: 'Reduce 80% workload',
    icon: Users,
    gradient: 'from-purple-500 to-pink-500',
    description: 'AI teaching assistant that handles lesson planning, grading, and student analytics. Focus on what matters — teaching.',
    features: [
      'AI lesson generator',
      'Auto-grading & feedback',
      'Student performance insights',
      'Scheme of work builder',
      'Class management tools',
      'ECZ alignment checks'
    ],
    cta: 'Empower Teaching'
  },
  {
    id: 'guardian',
    title: 'For Parents',
    subtitle: 'Support your child\'s journey',
    icon: Heart,
    gradient: 'from-emerald-500 to-green-500',
    description: 'Stay connected to your child\'s education. Get progress updates, communicate with teachers, and provide support at home.',
    features: [
      'Child progress dashboard',
      'Performance alerts',
      'Teacher messaging',
      'AI parenting advisor',
      'Weekly progress reports',
      'Study recommendations'
    ],
    cta: 'Connect Now'
  },
  {
    id: 'institution',
    title: 'For Schools',
    subtitle: 'Institution-wide excellence',
    icon: Building,
    gradient: 'from-orange-500 to-red-500',
    description: 'Comprehensive school management with AI-powered insights. Track performance, manage teachers, and improve outcomes.',
    features: [
      'School-wide analytics',
      'Teacher oversight',
      'Department performance',
      'Resource allocation',
      'Report generation',
      'API integrations'
    ],
    cta: 'Schedule Demo'
  },
  {
    id: 'ministry',
    title: 'For Ministry/NGOs',
    subtitle: 'National education insights',
    icon: Globe,
    gradient: 'from-indigo-500 to-violet-500',
    description: 'District and national-level analytics. Identify intervention areas, track policy impact, and improve education outcomes.',
    features: [
      'National dashboards',
      'District comparisons',
      'Policy impact analysis',
      'Intervention targeting',
      'Data exports & APIs',
      'Research support'
    ],
    cta: 'Contact Us'
  }
];

const ChatEduRoles = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            <Sparkles className="w-3 h-3 mr-1" />
            For Everyone in Education
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-foreground">One Platform,</span>
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Every Stakeholder
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Synapse connects students, teachers, parents, schools, and policymakers
            in one unified educational ecosystem.
          </p>
        </motion.div>

        {/* Roles Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {roles.map((role, idx) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className={idx === 0 ? 'md:col-span-2 lg:col-span-1' : ''}
            >
              <Card className={`relative h-full overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group ${
                role.popular ? 'ring-2 ring-primary' : ''
              }`}>
                {role.popular && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-primary text-white">
                      <Zap className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader>
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${role.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                    <role.icon className="w-7 h-7 text-white" />
                  </div>
                  <CardTitle className="text-xl">{role.title}</CardTitle>
                  <CardDescription>{role.subtitle}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {role.description}
                  </p>

                  <div className="space-y-2">
                    {role.features.slice(0, 4).map((feature) => (
                      <div key={feature} className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                          <Check className="w-2.5 h-2.5 text-emerald-500" />
                        </div>
                        <span className="text-sm text-foreground">{feature}</span>
                      </div>
                    ))}
                    {role.features.length > 4 && (
                      <p className="text-xs text-primary pl-6">
                        + {role.features.length - 4} more features
                      </p>
                    )}
                  </div>

                  <Button 
                    className={`w-full bg-gradient-to-r ${role.gradient} hover:opacity-90 mt-4`}
                    onClick={() => navigate('/auth?mode=signup')}
                  >
                    {role.cta}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 max-w-4xl mx-auto"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: '50,000+', label: 'Students', icon: GraduationCap },
              { value: '2,500+', label: 'Teachers', icon: Users },
              { value: '150+', label: 'Schools', icon: Building },
              { value: '10', label: 'Provinces', icon: Globe },
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                className="text-center p-6 rounded-2xl bg-card border border-border"
              >
                <stat.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ChatEduRoles;
