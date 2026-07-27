
import React from 'react';
import LearningAnalytics from '@/components/Dashboard/LearningAnalytics';

const LearningAnalyticsPage = () => {
  return (
    <div className="space-y-4">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-foreground">Learning Analytics</h1>
          <p className="text-muted-foreground">Track your progress and optimize your learning journey</p>
        </div>
        <LearningAnalytics />
      </div>
    </div>
  );
};

export default LearningAnalyticsPage;
