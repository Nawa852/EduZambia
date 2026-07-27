import { motion } from 'framer-motion';
import { 
  Check, X, Zap, Crown, Building, Sparkles,
  GraduationCap, Users, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: string;
  period: string;
  icon: React.ElementType;
  gradient: string;
  features: { text: string; included: boolean }[];
  cta: string;
  popular?: boolean;
  badge?: string;
}

const plans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Get started with basic AI learning',
    price: 'K0',
    period: 'forever',
    icon: GraduationCap,
    gradient: 'from-gray-500 to-gray-600',
    features: [
      { text: '5 AI questions per day', included: true },
      { text: 'Basic subjects (Math, English, Science)', included: true },
      { text: 'Text-only responses', included: true },
      { text: 'Community support', included: true },
      { text: 'Unlimited photo solving', included: false },
      { text: 'Voice interaction', included: false },
      { text: 'Offline mode', included: false },
      { text: 'Priority AI responses', included: false },
    ],
    cta: 'Get Started Free'
  },
  {
    id: 'student',
    name: 'Student Pro',
    description: 'Unlimited learning for serious students',
    price: 'K49',
    period: '/month',
    icon: Zap,
    gradient: 'from-primary to-accent',
    popular: true,
    badge: 'Most Popular',
    features: [
      { text: 'Unlimited AI questions', included: true },
      { text: 'All ECZ subjects (Grade 7-12)', included: true },
      { text: 'Photo & voice solving', included: true },
      { text: 'Personalized learning paths', included: true },
      { text: 'Offline study mode', included: true },
      { text: 'Priority AI responses', included: true },
      { text: 'Progress analytics', included: true },
      { text: 'Certificate on completion', included: true },
    ],
    cta: 'Start Free Trial'
  },
  {
    id: 'teacher',
    name: 'Teacher Pro',
    description: 'AI-powered teaching assistant',
    price: 'K99',
    period: '/month',
    icon: Users,
    gradient: 'from-purple-500 to-pink-500',
    features: [
      { text: 'Everything in Student Pro', included: true },
      { text: 'AI lesson generator', included: true },
      { text: 'Auto-grading & feedback', included: true },
      { text: 'Class management (50 students)', included: true },
      { text: 'Student analytics dashboard', included: true },
      { text: 'Scheme of work builder', included: true },
      { text: 'Parent communication tools', included: true },
      { text: 'Priority support', included: true },
    ],
    cta: 'Start Free Trial'
  },
  {
    id: 'school',
    name: 'School',
    description: 'For institutions & departments',
    price: 'Custom',
    period: 'pricing',
    icon: Building,
    gradient: 'from-orange-500 to-red-500',
    features: [
      { text: 'Everything in Teacher Pro', included: true },
      { text: 'Unlimited teachers & students', included: true },
      { text: 'School-wide analytics', included: true },
      { text: 'Admin dashboard', included: true },
      { text: 'Custom branding', included: true },
      { text: 'API integrations', included: true },
      { text: 'Dedicated account manager', included: true },
      { text: 'Training & onboarding', included: true },
    ],
    cta: 'Contact Sales'
  },
];

const ChatEduPricing = () => {
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
            <Crown className="w-3 h-3 mr-1" />
            Simple Pricing
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-foreground">Choose Your</span>
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Learning Plan
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Start free, upgrade when you're ready. Cancel anytime.
          </p>
        </motion.div>

        {/* Pricing Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className={`relative h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${
                plan.popular ? 'ring-2 ring-primary scale-105 lg:scale-110' : ''
              }`}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-white shadow-lg">
                      <Sparkles className="w-3 h-3 mr-1" />
                      {plan.badge}
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-r ${plan.gradient} flex items-center justify-center mb-4`}>
                    <plan.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {plan.features.map((feature, featureIdx) => (
                      <div key={featureIdx} className="flex items-start gap-2">
                        {feature.included ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-emerald-500" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                            <X className="w-3 h-3 text-muted-foreground" />
                          </div>
                        )}
                        <span className={`text-sm ${feature.included ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Button 
                    className={`w-full ${plan.popular ? `bg-gradient-to-r ${plan.gradient}` : ''}`}
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => navigate('/auth?mode=signup')}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* FAQ / Trust */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center max-w-2xl mx-auto"
        >
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>7-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>Mobile money accepted</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>Student discounts</span>
            </div>
          </div>
          
          <p className="mt-8 text-muted-foreground">
            Need a custom plan for your school or organization?{' '}
            <a href="/contact" className="text-primary hover:underline">Contact our sales team</a>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default ChatEduPricing;
