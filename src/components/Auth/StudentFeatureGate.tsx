import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { isStudentNavVisible } from '@/config/studentFeatures';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';

/**
 * Blocks direct URL deep links into Tier 2 / Tier 3 features for students.
 * Other roles pass straight through — nothing is deleted, just paused.
 */
const StudentFeatureGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useProfile();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();

  const role = (profile?.role || 'student') as string;
  const isStudent = role === 'student';
  const url = `${pathname}${search}`;

  if (!isStudent || isStudentNavVisible(url)) return <>{children}</>;

  return (
    <div className="max-w-lg mx-auto py-12 px-4">
      <Card className="border-border/60">
        <CardContent className="p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight">Coming soon</h2>
          <p className="text-sm text-muted-foreground">
            This part of Synapse is paused while we focus on studying, practice and family link.
            It will switch on as more students join your school.
          </p>
          <div className="flex gap-2 justify-center pt-2">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>Home</Button>
            <Button onClick={() => navigate('/synapse')}>Open Synapse AI</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentFeatureGate;
