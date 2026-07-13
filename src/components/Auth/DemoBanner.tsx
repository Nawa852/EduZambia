import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/Auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { X, Eye, ArrowRight } from 'lucide-react';

const DemoBanner = () => {
  const { isDemo, exitDemoMode } = useAuth();
  const navigate = useNavigate();

  if (!isDemo) return null;

  return (
    <div className="relative z-30 bg-primary/95 backdrop-blur-xl text-primary-foreground py-2 px-4 flex items-center justify-between gap-2 text-xs shadow-lg">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-primary-foreground/15 flex items-center justify-center">
          <Eye className="w-3 h-3" />
        </div>
        <span className="font-semibold">Demo Mode</span>
        <span className="hidden sm:inline text-primary-foreground/70">— Exploring as guest</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          variant="secondary"
          className="h-7 text-[11px] rounded-full px-3 font-semibold gap-1"
          onClick={() => { exitDemoMode(); navigate('/auth?mode=signup'); }}
        >
          Sign Up <ArrowRight className="w-3 h-3" />
        </Button>
        <button
          onClick={() => { exitDemoMode(); navigate('/'); }}
          className="w-7 h-7 rounded-full flex items-center justify-center text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/10 transition-all"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default DemoBanner;
