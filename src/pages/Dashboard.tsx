import React from 'react';
import { useProfile } from '@/hooks/useProfile';
import { StudentDashboardV2 } from '@/components/Dashboard/v2/StudentDashboardV2';
import { TeacherDashboardV2 } from '@/components/Dashboard/v2/TeacherDashboardV2';
import { SchoolAdminDashboardV2 } from '@/components/Dashboard/v2/SchoolAdminDashboardV2';
import { GuardianDashboardV2 } from '@/components/Dashboard/v2/GuardianDashboardV2';
import { DashboardSkeleton } from '@/components/Dashboard/DashboardSkeleton';

const Dashboard = () => {
  const { profile, loading } = useProfile();

  // Render skeleton only when we have no profile data at all (first sign-in).
  // Subsequent visits hydrate from localStorage cache and render instantly.
  if (loading && !profile) {
    return (
      <div className="p-4 lg:p-6">
        <DashboardSkeleton />
      </div>
    );
  }


  const userName = profile?.full_name || 'Learner';
  const userType = (profile?.role || 'student') as string;

  const renderDashboardView = () => {
    switch (userType) {
      case 'teacher': return <TeacherDashboardV2 userName={userName} />;
      case 'guardian': return <GuardianDashboardV2 userName={userName} />;
      case 'institution':
      case 'school_admin': return <SchoolAdminDashboardV2 userName={userName} />;
      default: return <StudentDashboardV2 userName={userName} />;
    }
  };

  return (
    <div>
      {renderDashboardView()}
    </div>
  );
};

export default Dashboard;
