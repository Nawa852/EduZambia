import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, Quote, ChevronLeft, ChevronRight, 
  GraduationCap, Users, Building, MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  school: string;
  location: string;
  avatar: string;
  quote: string;
  rating: number;
  type: 'student' | 'teacher' | 'parent' | 'admin';
  improvement?: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Mwila Banda',
    role: 'Grade 12 Student',
    school: 'Munali Secondary School',
    location: 'Lusaka',
    avatar: 'MB',
    quote: 'The AI tutor helped me understand calculus in ways my textbook never could. I went from a C to an A in just one term. The step-by-step explanations are amazing!',
    rating: 5,
    type: 'student',
    improvement: 'Grade C → A'
  },
  {
    id: 2,
    name: 'Mrs. Chipasha Mulenga',
    role: 'Physics Teacher',
    school: 'Kabulonga Girls Secondary',
    location: 'Lusaka',
    avatar: 'CM',
    quote: 'Synapse has cut my lesson planning time by 70%. The AI generates ECZ-aligned content that I just need to review. I now have more time for actual teaching.',
    rating: 5,
    type: 'teacher',
    improvement: '70% time saved'
  },
  {
    id: 3,
    name: 'Mr. Brighton Phiri',
    role: 'Parent',
    school: 'Parent of Grade 9 Student',
    location: 'Kitwe',
    avatar: 'BP',
    quote: 'I can finally see what my daughter is learning and where she needs help. The weekly reports and AI suggestions help me support her studies at home.',
    rating: 5,
    type: 'parent'
  },
  {
    id: 4,
    name: 'Dr. Mwansa Kapembwa',
    role: 'Head Teacher',
    school: 'Chibombo Day Secondary',
    location: 'Chibombo',
    avatar: 'MK',
    quote: 'Our school\'s pass rate improved by 23% after implementing Synapse. The analytics help us identify struggling students before they fall behind.',
    rating: 5,
    type: 'admin',
    improvement: '23% better pass rate'
  },
  {
    id: 5,
    name: 'Thandiwe Zulu',
    role: 'Grade 11 Student',
    school: 'Hillcrest National Technical',
    location: 'Livingstone',
    avatar: 'TZ',
    quote: 'I love the flashcards and quiz features! Studying has become fun. The AI remembers my weak areas and helps me practice those topics more.',
    rating: 5,
    type: 'student'
  },
  {
    id: 6,
    name: 'Mr. Kelvin Tembo',
    role: 'Mathematics HOD',
    school: 'Choma Secondary School',
    location: 'Choma',
    avatar: 'KT',
    quote: 'The auto-grading feature alone saves me 10 hours a week. Plus, students get instant feedback, which has dramatically improved their understanding.',
    rating: 5,
    type: 'teacher',
    improvement: '10 hrs/week saved'
  }
];

const ChatEduTestimonials = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [autoPlay]);

  const handlePrev = () => {
    setAutoPlay(false);
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const handleNext = () => {
    setAutoPlay(false);
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const getTypeIcon = (type: Testimonial['type']) => {
    switch (type) {
      case 'student': return GraduationCap;
      case 'teacher': return Users;
      case 'parent': return Users;
      case 'admin': return Building;
    }
  };

  return (
    <section className="py-24 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            <Star className="w-3 h-3 mr-1 fill-current" />
            Success Stories
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-foreground">Loved by Students &</span>
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Educators Across Zambia
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Join thousands of learners who have transformed their education with Synapse
          </p>
        </motion.div>

        {/* Main Testimonial */}
        <div className="max-w-4xl mx-auto mb-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
              className="relative bg-card rounded-3xl border border-border shadow-2xl p-8 md:p-12"
            >
              {/* Quote Icon */}
              <Quote className="absolute top-8 right-8 w-12 h-12 text-primary/10" />

              {/* Content */}
              <div className="space-y-6">
                {/* Stars */}
                <div className="flex gap-1">
                  {[...Array(testimonials[activeIndex].rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="text-xl md:text-2xl text-foreground leading-relaxed">
                  "{testimonials[activeIndex].quote}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center justify-between pt-6 border-t border-border">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-14 h-14 border-2 border-primary">
                      <AvatarFallback className="bg-gradient-to-r from-primary to-accent text-white font-bold">
                        {testimonials[activeIndex].avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-foreground">{testimonials[activeIndex].name}</p>
                      <p className="text-sm text-muted-foreground">{testimonials[activeIndex].role}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <MapPin className="w-3 h-3" />
                        {testimonials[activeIndex].school}, {testimonials[activeIndex].location}
                      </div>
                    </div>
                  </div>

                  {testimonials[activeIndex].improvement && (
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      {testimonials[activeIndex].improvement}
                    </Badge>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrev}
              className="rounded-full"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <div className="flex gap-2">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setAutoPlay(false);
                    setActiveIndex(idx);
                  }}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    idx === activeIndex
                      ? 'bg-primary w-8'
                      : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              className="rounded-full"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mini Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {testimonials.slice(0, 3).map((testimonial, idx) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-card rounded-xl border border-border p-4 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => {
                setAutoPlay(false);
                setActiveIndex(idx);
              }}
            >
              <div className="flex items-start gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-gradient-to-r from-primary/20 to-accent/20 text-primary text-sm font-medium">
                    {testimonial.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                </div>
                <div className="flex">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                "{testimonial.quote.slice(0, 80)}..."
              </p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <p className="text-muted-foreground mb-4">
            Join 50,000+ learners transforming their education
          </p>
          <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
            Start Your Journey
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default ChatEduTestimonials;
