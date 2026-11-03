import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, ArrowRight, UserCog } from 'lucide-react';
import { useProfileCompleteness } from '@/hooks/useProfileCompleteness';

export const ProfileCompletenessCard = () => {
  const { percent, missing, isComplete } = useProfileCompleteness();
  const navigate = useNavigate();

  if (isComplete) {
    return (
      <Card className="border-green-500/30 bg-green-500/[0.04]">
        <CardContent className="p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Profile complete 🎉</p>
            <p className="text-xs text-muted-foreground">All recommended fields are filled in.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <UserCog className="w-4 h-4 text-primary" /> Complete your profile
          </CardTitle>
          <span className="text-xs font-bold text-primary">{percent}%</span>
        </div>
        <Progress value={percent} className="h-1.5 mt-2" />
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-muted-foreground mb-2">
          {missing.length} field{missing.length === 1 ? '' : 's'} missing — finish to unlock personalized recommendations.
        </p>
        <div className="space-y-1.5 max-h-44 overflow-y-auto">
          {missing.slice(0, 6).map((m) => (
            <button
              key={m.key}
              onClick={() => navigate(m.link)}
              className="w-full flex items-center justify-between text-left px-3 py-2 rounded-lg border border-border/30 hover:border-primary/40 hover:bg-primary/5 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <AlertCircle className="w-3.5 h-3.5 text-warning shrink-0" />
                <span className="text-xs font-medium truncate">{m.label}</span>
              </div>
              <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
        {missing.length > 6 && (
          <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => navigate('/profile?tab=settings')}>
            View all {missing.length} missing fields
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
