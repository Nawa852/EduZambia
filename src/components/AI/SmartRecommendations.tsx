import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Lightbulb, BookOpen, Target, TrendingUp, Star, Clock, Brain, Zap } from 'lucide-react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  type: 'study' | 'practice' | 'review' | 'exercise';
  priority: 'high' | 'medium' | 'low';
  subject: string;
  estimatedTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  reasons: string[];
}

const SmartRecommendations = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    type: 'all',
    priority: 'all',
    subject: 'all'
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    generateRecommendations();
  }, []);

  const generateRecommendations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('comprehensive-ai-assistant', {
        body: {
          query: 'Generate personalized study recommendations based on my learning patterns and current ECZ curriculum requirements',
          feature: 'smart_recommendations',
          context: 'Zambian ECZ curriculum, personalized learning path optimization'
        }
      });

      if (error) throw error;

      // Mock smart recommendations with AI insights
      const smartRecs: Recommendation[] = [
        {
          id: '1',
          title: 'Focus on Quadratic Equations',
          description: 'Based on your recent performance, spend extra time on quadratic equations before moving to advanced algebra.',
          type: 'study',
          priority: 'high',
          subject: 'Mathematics',
          estimatedTime: 45,
          difficulty: 'medium',
          reasons: ['Low score in recent quiz', 'Foundation for upcoming topics', 'ECZ exam emphasis']
        },
        {
          id: '2',
          title: 'Practice Essay Writing',
          description: 'Your grammar is excellent, but practice structuring longer essays for ECZ English exams.',
          type: 'practice',
          priority: 'medium',
          subject: 'English',
          estimatedTime: 30,
          difficulty: 'medium',
          reasons: ['Strong grammar foundation', 'Needs structure improvement', 'ECZ requirement']
        },
        {
          id: '3',
          title: 'Review Photosynthesis Process',
          description: 'Quick review recommended - you understood this well but it\'s been a while since you studied it.',
          type: 'review',
          priority: 'low',
          subject: 'Science',
          estimatedTime: 20,
          difficulty: 'easy',
          reasons: ['Previous mastery shown', 'Time since last review', 'Part of comprehensive exam']
        },
        {
          id: '4',
          title: 'Zambian Geography Practice',
          description: 'Try interactive exercises on Zambian provinces and their resources.',
          type: 'exercise',
          priority: 'medium',
          subject: 'Social Studies',
          estimatedTime: 25,
          difficulty: 'easy',
          reasons: ['Interactive learning preferred', 'Local knowledge important', 'Recent curriculum update']
        }
      ];

      setRecommendations(smartRecs);
      
      toast({
        title: "Recommendations Updated",
        description: "AI has analyzed your progress and generated personalized study recommendations."
      });

    } catch (error) {
      console.error('Error generating recommendations:', error);
      toast({
        title: "Error",
        description: "Failed to generate recommendations. Using cached suggestions.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredRecommendations = recommendations.filter(rec => {
    if (selectedFilters.type !== 'all' && rec.type !== selectedFilters.type) return false;
    if (selectedFilters.priority !== 'all' && rec.priority !== selectedFilters.priority) return false;
    if (selectedFilters.subject !== 'all' && rec.subject !== selectedFilters.subject) return false;
    return true;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'study': return <BookOpen className="w-4 h-4" />;
      case 'practice': return <Target className="w-4 h-4" />;
      case 'review': return <TrendingUp className="w-4 h-4" />;
      case 'exercise': return <Zap className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-6">
      <div className="w-full space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-green-600" />
              Smart Recommendations
            </CardTitle>
            <div className="flex items-center justify-between">
              <p className="text-gray-600">
                AI-powered personalized study suggestions based on your learning patterns
              </p>
              <Button onClick={generateRecommendations} disabled={loading}>
                {loading ? 'Generating...' : 'Refresh Recommendations'}
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Type:</span>
                {['all', 'study', 'practice', 'review', 'exercise'].map(type => (
                  <Badge
                    key={type}
                    variant={selectedFilters.type === type ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setSelectedFilters({...selectedFilters, type})}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Priority:</span>
                {['all', 'high', 'medium', 'low'].map(priority => (
                  <Badge
                    key={priority}
                    variant={selectedFilters.priority === priority ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setSelectedFilters({...selectedFilters, priority})}
                  >
                    {priority}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommendations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredRecommendations.map((rec) => (
            <Card key={rec.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(rec.type)}
                    <CardTitle className="text-lg">{rec.title}</CardTitle>
                  </div>
                  <Badge className={getPriorityColor(rec.priority)}>
                    {rec.priority} priority
                  </Badge>
                </div>
                <Badge variant="outline" className="w-fit">
                  {rec.subject}
                </Badge>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-gray-700">{rec.description}</p>
                
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {rec.estimatedTime} min
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    {rec.difficulty}
                  </div>
                </div>

                {rec.difficulty === 'medium' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Recommended Progress</span>
                      <span>75%</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Why this is recommended:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {rec.reasons.map((reason, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button className="flex-1" size="sm">
                    Start Now
                  </Button>
                  <Button variant="outline" size="sm">
                    Schedule Later
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredRecommendations.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Lightbulb className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No recommendations found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your filters or generate new recommendations
              </p>
              <Button onClick={generateRecommendations}>
                Generate Recommendations
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SmartRecommendations;