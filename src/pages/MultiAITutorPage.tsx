import React from 'react';
import MultiAITutorChat from '@/components/AI/MultiAITutorChat';

const MultiAITutorPage = () => {
  return (
    <div className="space-y-4">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            AI Tutor
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Powered by multiple AI models — ask anything about your studies, get step-by-step solutions, and prepare for ECZ exams.
          </p>
        </div>
        <MultiAITutorChat />
      </div>
    </div>
  );
};

export default MultiAITutorPage;