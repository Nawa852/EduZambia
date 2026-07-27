
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, MessageSquare, Calendar, Globe, Lightbulb } from 'lucide-react';

const AIStudyBuddyPage = () => {
  return (
    <div className="space-y-4">
      <div className="w-full">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <Users className="w-10 h-10 text-teal-600" />
            AI Study Buddy
          </h1>
          <p className="text-lg text-gray-600">Provides virtual ECZ study companions with AI-powered interactions</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-l-4 border-teal-500">
            <CardHeader><CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-teal-600" />AI-Powered Buddy Simulator</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-gray-600 mb-4">Simulates ECZ study partners with StealthGPT</p><Button className="w-full">Start Session</Button></CardContent>
          </Card>
          
          <Card className="border-l-4 border-blue-500">
            <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="w-5 h-5 text-blue-600" />Dynamic Buddy Chat</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-gray-600 mb-4">Facilitates study discussions</p><Button className="w-full">Chat Now</Button></CardContent>
          </Card>
          
          <Card className="border-l-4 border-purple-500">
            <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5 text-purple-600" />Offline Buddy Cache</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-gray-600 mb-4">Stores chats offline</p><Button className="w-full">Sync Chats</Button></CardContent>
          </Card>
          
          <Card className="border-l-4 border-green-500">
            <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5 text-green-600" />Multilingual Buddy Narrator</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-gray-600 mb-4">Narrates in 7 languages</p><Button className="w-full">Select Language</Button></CardContent>
          </Card>
          
          <Card className="border-l-4 border-orange-500">
            <CardHeader><CardTitle className="flex items-center gap-2"><Lightbulb className="w-5 h-5 text-orange-600" />AI-Powered Buddy Recommender</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-gray-600 mb-4">Suggests study topics</p><Button className="w-full">Get Suggestions</Button></CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AIStudyBuddyPage;
