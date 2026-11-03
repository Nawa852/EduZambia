import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LayoutDashboard, BookOpen, FileText, Target, Brain, 
  Trophy, Users, Briefcase, Wifi, Sparkles, Calendar, Zap
} from 'lucide-react';
import { SmartWelcomePanel } from './SmartWelcomePanel';
import { TodaySnapshot } from './TodaySnapshot';
import { SubjectsHub } from './SubjectsHub';
import { AssignmentsSystem } from './AssignmentsSystem';
import { ExamReadiness } from './ExamReadiness';
import { AILearningAssistant } from './AILearningAssistant';
import { MotivationEngagement } from './MotivationEngagement';
import { CommunicationSupport } from './CommunicationSupport';
import { LifeSkillsCareer } from './LifeSkillsCareer';
import { OfflineIndicator } from './OfflineIndicator';

interface ComprehensiveLearnerDashboardProps {
  userName: string;
}

export const ComprehensiveLearnerDashboard = ({ userName }: ComprehensiveLearnerDashboardProps) => {
  return (
    <div className="space-y-6">
      {/* Offline Status */}
      <OfflineIndicator />
      
      {/* Smart Welcome Panel */}
      <SmartWelcomePanel userName={userName} />


      
      {/* Today's Snapshot */}
      <TodaySnapshot />

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="flex flex-wrap gap-1 h-auto p-1 bg-muted/50">
          <TabsTrigger value="overview" className="gap-2">
            <LayoutDashboard className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="subjects" className="gap-2">
            <BookOpen className="w-4 h-4" />
            Subjects
          </TabsTrigger>
          <TabsTrigger value="assignments" className="gap-2">
            <FileText className="w-4 h-4" />
            Assignments
          </TabsTrigger>
          <TabsTrigger value="exams" className="gap-2">
            <Target className="w-4 h-4" />
            Exams
          </TabsTrigger>
          <TabsTrigger value="ai-tutor" className="gap-2">
            <Brain className="w-4 h-4" />
            AI Tutor
          </TabsTrigger>
          <TabsTrigger value="achievements" className="gap-2">
            <Trophy className="w-4 h-4" />
            Achievements
          </TabsTrigger>
          <TabsTrigger value="community" className="gap-2">
            <Users className="w-4 h-4" />
            Community
          </TabsTrigger>
          <TabsTrigger value="career" className="gap-2">
            <Briefcase className="w-4 h-4" />
            Career
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <SubjectsHub />
              <AssignmentsSystem />
            </div>
            <div className="space-y-6">
              <AILearningAssistant />
              <MotivationEngagement />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="subjects"><SubjectsHub /></TabsContent>
        <TabsContent value="assignments"><AssignmentsSystem /></TabsContent>
        <TabsContent value="exams"><ExamReadiness /></TabsContent>
        <TabsContent value="ai-tutor"><AILearningAssistant /></TabsContent>
        <TabsContent value="achievements"><MotivationEngagement /></TabsContent>
        <TabsContent value="community"><CommunicationSupport /></TabsContent>
        <TabsContent value="career"><LifeSkillsCareer /></TabsContent>
      </Tabs>
    </div>
  );
};
