import React from 'react';
import AchievementSystem from '@/components/Gamification/AchievementSystem';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { useClipboard } from '@/hooks/useClipboard';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const Achievements = () => {
  const { copy } = useClipboard();

  const handleShare = () => {
    copy(`🏆 Check out my achievements on Synapse! ${window.location.origin}/achievements`);
    toast.success('Achievement link copied to clipboard!');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div />
        <Button variant="outline" size="sm" className="gap-2" onClick={handleShare}>
          <Share2 className="w-4 h-4" /> Share
        </Button>
      </div>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative"
      >
        <div className="absolute inset-0 bg-primary/5 rounded-xl blur-xl pointer-events-none animate-pulse" />
        <div className="relative">
          <AchievementSystem />
        </div>
      </motion.div>
    </div>
  );
};

export default Achievements;
