import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Menu, X, ChevronDown, Sparkles, BookOpen, Users, 
  GraduationCap, Building, Globe, Zap, Brain, Video,
  FileText, Target, MessageSquare, Award, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ChatEduNavbar = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const navItems = [
    {
      label: 'Products',
      dropdown: [
        { icon: Brain, label: 'AI Tutor', description: 'Personal AI learning companion', href: '/ai' },
        { icon: BookOpen, label: 'Smart Courses', description: 'ECZ-aligned curriculum', href: '/courses' },
        { icon: Target, label: 'Practice Lab', description: 'Adaptive quizzes & tests', href: '/study-tools' },
        { icon: Video, label: 'Video Learning', description: 'Curated video lessons', href: '/video-learning' },
      ]
    },
    {
      label: 'Solutions',
      dropdown: [
        { icon: GraduationCap, label: 'For Students', description: 'Learn smarter, not harder', href: '/welcome' },
        { icon: Users, label: 'For Teachers', description: 'Reduce 80% workload', href: '/welcome' },
        { icon: Building, label: 'For Schools', description: 'Institution-wide analytics', href: '/welcome' },
        { icon: Globe, label: 'For Ministry', description: 'National education insights', href: '/welcome' },
      ]
    },
    { label: 'Pricing', href: '/pricing' },
    { label: 'About', href: '/about' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-xl text-foreground">Synapse</span>
              <span className="hidden sm:inline text-xs text-muted-foreground ml-2">Powered by BrightSphere</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <div 
                key={item.label}
                className="relative"
                onMouseEnter={() => item.dropdown && setActiveDropdown(item.label)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                {item.dropdown ? (
                  <button className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    {item.label}
                    <ChevronDown className={cn(
                      "w-4 h-4 transition-transform",
                      activeDropdown === item.label && "rotate-180"
                    )} />
                  </button>
                ) : (
                  <Link 
                    to={item.href || '#'} 
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </Link>
                )}

                {/* Dropdown */}
                <AnimatePresence>
                  {item.dropdown && activeDropdown === item.label && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 w-72 bg-card rounded-xl border border-border shadow-xl p-2 mt-1"
                    >
                      {item.dropdown.map((dropItem) => (
                        <Link
                          key={dropItem.label}
                          to={dropItem.href}
                          className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                        >
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 flex items-center justify-center flex-shrink-0">
                            <dropItem.icon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{dropItem.label}</p>
                            <p className="text-xs text-muted-foreground">{dropItem.description}</p>
                          </div>
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Right Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/auth')}>
              Log in
            </Button>
            <Button 
              onClick={() => navigate('/auth?mode=signup')}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              <Zap className="w-4 h-4 mr-2" />
              Get Started Free
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="lg:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-background border-b border-border"
          >
            <div className="container mx-auto px-4 py-4 space-y-4">
              {navItems.map((item) => (
                <div key={item.label}>
                  {item.dropdown ? (
                    <div className="space-y-2">
                      <p className="font-semibold text-foreground">{item.label}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {item.dropdown.map((dropItem) => (
                          <Link
                            key={dropItem.label}
                            to={dropItem.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-2 p-2 rounded-lg bg-muted"
                          >
                            <dropItem.icon className="w-4 h-4 text-primary" />
                            <span className="text-sm">{dropItem.label}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Link 
                      to={item.href || '#'}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-2 font-medium text-foreground"
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
              <div className="flex gap-3 pt-4 border-t border-border">
                <Button variant="outline" className="flex-1" onClick={() => { navigate('/auth'); setMobileMenuOpen(false); }}>
                  Log in
                </Button>
                <Button className="flex-1 bg-gradient-to-r from-primary to-accent" onClick={() => { navigate('/auth?mode=signup'); setMobileMenuOpen(false); }}>
                  Sign Up
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default ChatEduNavbar;
