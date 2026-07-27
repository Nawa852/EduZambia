import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sparkles, Facebook, Twitter, Instagram, Youtube, Linkedin,
  Mail, Phone, MapPin, ArrowRight, Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const ChatEduFooter = () => {
  const footerLinks = {
    product: [
      { label: 'AI Tutor', href: '/ai' },
      { label: 'Smart Courses', href: '/courses' },
      { label: 'Practice Lab', href: '/study-tools' },
      { label: 'Video Learning', href: '/video-learning' },
      { label: 'Pricing', href: '/pricing' },
    ],
    solutions: [
      { label: 'For Students', href: '/welcome' },
      { label: 'For Teachers', href: '/welcome' },
      { label: 'For Parents', href: '/welcome' },
      { label: 'For Schools', href: '/welcome' },
      { label: 'For Ministry', href: '/welcome' },
    ],
    resources: [
      { label: 'Blog', href: '/blog' },
      { label: 'Help Center', href: '/help' },
      { label: 'Community', href: '/community' },
      { label: 'ECZ Syllabus', href: '/syllabus' },
      { label: 'API Docs', href: '/api' },
    ],
    company: [
      { label: 'About Us', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Press', href: '/press' },
      { label: 'Contact', href: '/contact' },
      { label: 'Partners', href: '/partners' },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Youtube, href: '#', label: 'YouTube' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
  ];

  return (
    <footer className="bg-foreground text-background">
      {/* Newsletter Section */}
      <div className="border-b border-background/10">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">Stay Updated</h3>
              <p className="text-background/70">
                Get weekly study tips, new features, and exclusive content
              </p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Input 
                type="email" 
                placeholder="Enter your email" 
                className="bg-background/10 border-background/20 text-background placeholder:text-background/50 w-full md:w-64"
              />
              <Button className="bg-primary hover:bg-primary/90">
                Subscribe
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">Synapse</span>
            </Link>
            <p className="text-background/70 text-sm mb-6 max-w-xs">
              Zambia's #1 AI-powered learning platform. Built for students, 
              loved by teachers, trusted by schools.
            </p>
            <div className="space-y-2 text-sm text-background/70">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>hello@eduzambia.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>+260 97 123 4567</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Lusaka, Zambia</span>
              </div>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.href}
                    className="text-sm text-background/70 hover:text-background transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Solutions */}
          <div>
            <h4 className="font-semibold mb-4">Solutions</h4>
            <ul className="space-y-2">
              {footerLinks.solutions.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.href}
                    className="text-sm text-background/70 hover:text-background transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.href}
                    className="text-sm text-background/70 hover:text-background transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.href}
                    className="text-sm text-background/70 hover:text-background transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Social Links */}
        <div className="flex items-center gap-4 mt-12 pt-8 border-t border-background/10">
          {socialLinks.map((social) => (
            <a
              key={social.label}
              href={social.href}
              className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary transition-colors"
              aria-label={social.label}
            >
              <social.icon className="w-5 h-5" />
            </a>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-background/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-background/70">
            <p>
              © 2024 Synapse. All rights reserved. Made with{' '}
              <Heart className="w-4 h-4 inline text-red-500 fill-red-500" />{' '}
              in Zambia
            </p>
            <div className="flex items-center gap-4">
              <Link to="/privacy" className="hover:text-background">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-background">Terms of Service</Link>
              <Link to="/cookies" className="hover:text-background">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Powered by Badge */}
      <div className="bg-gradient-to-r from-primary to-accent py-2 text-center text-white text-sm">
        <span className="flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4" />
          Powered by BrightSphere AI • 16+ AI Models • ECZ Aligned
        </span>
      </div>
    </footer>
  );
};

export default ChatEduFooter;
