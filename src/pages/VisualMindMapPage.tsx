
import React from 'react';
import VisualMindMapBuilder from '@/components/AI/VisualMindMapBuilder';

const VisualMindMapPage = () => {
  return (
    <div className="space-y-4">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-4">
            AI Visual Mind Map Builder
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Create interactive mind maps with AI assistance for visual learning and concept organization
          </p>
        </div>
        <VisualMindMapBuilder />
      </div>
    </div>
  );
};

export default VisualMindMapPage;
