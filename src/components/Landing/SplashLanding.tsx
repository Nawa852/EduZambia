import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/Auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, LogIn } from 'lucide-react';
import eduMark from '@/assets/edu-zambia-icon.png';

const SplashLanding = () => {
  const { enterDemoMode } = useAuth();
  const navigate = useNavigate();
  const tryDemo = () => { enterDemoMode(); navigate('/dashboard'); };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-6 text-center">
      <div className="flex flex-col items-center max-w-md w-full">
        <img
          src={eduMark}
          alt="Synapse"
          className="w-24 h-24 rounded-3xl shadow-xl mb-8"
        />
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">Synapse</h1>
        <p className="mt-3 text-base text-muted-foreground">
          Learn anything. Grow anywhere.
        </p>

        <div className="mt-10 w-full flex flex-col gap-3">
          <Button size="lg" className="h-12 text-base rounded-full" asChild>
            <Link to="/signup">
              Get started <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="h-12 text-base rounded-full" asChild>
            <Link to="/login"><LogIn className="w-4 h-4 mr-2" /> Sign in</Link>
          </Button>
          <button
            onClick={tryDemo}
            className="mt-2 text-sm text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5" /> Try the demo
          </button>
        </div>
      </div>

      <footer className="absolute bottom-6 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Synapse · Made in Zambia
      </footer>
    </div>
  );
};

export default SplashLanding;
