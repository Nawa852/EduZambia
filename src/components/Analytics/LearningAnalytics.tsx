
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, TrendingUp, Clock, Target, Eye, Brain, 
  Calendar, Activity, Users, BookOpen, Star, Award
} from "lucide-react";

const LearningAnalytics = () => {
  const [timeRange, setTimeRange] = useState('week');
  
  const [analyticsData, setAnalyticsData] = useState({
    totalStudyTime: 47,
    averageSessionTime: 23,
    coursesInProgress: 4,
    coursesCompleted: 2,
    quizzesTaken: 18,
    averageScore: 87,
    streakDays: 12,
    skillsImproved: 6
  });

  const [engagementData, setEngagementData] = useState([
    { day: 'Mon', hours: 2.5, engagement: 85 },
    { day: 'Tue', hours: 1.8, engagement: 78 },
    { day: 'Wed', hours: 3.2, engagement: 92 },
    { day: 'Thu', hours: 2.1, engagement: 80 },
    { day: 'Fri', hours: 1.5, engagement: 75 },
    { day: 'Sat', hours: 0.8, engagement: 65 },
    { day: 'Sun', hours: 2.0, engagement: 88 }
  ]);

  const [skillProgress, setSkillProgress] = useState([
    { skill: 'JavaScript Programming', current: 85, target: 90, trend: 'up' },
    { skill: 'Mathematics', current: 72, target: 80, trend: 'up' },
    { skill: 'English Writing', current: 91, target: 95, trend: 'stable' },
    { skill: 'Science', current: 68, target: 75, trend: 'up' },
    { skill: 'Critical Thinking', current: 79, target: 85, trend: 'down' }
  ]);

  const [learningPatterns, setLearningPatterns] = useState([
    { pattern: 'Best Learning Time', value: '2:00 PM - 4:00 PM', icon: Clock },
    { pattern: 'Most Productive Day', value: 'Wednesday', icon: Calendar },
    { pattern: 'Preferred Content Type', value: 'Interactive Videos', icon: Eye },
    { pattern: 'Learning Style', value: 'Visual + Hands-on', icon: Brain }
  ]);

  const [predictions, setPredictions] = useState([
    { 
      title: 'Course Completion Prediction',
      description: 'JavaScript Fundamentals',
      prediction: 'Will complete in 8 days',
      confidence: 92,
      status: 'on-track'
    },
    {
      title: 'Skill Mastery Forecast',
      description: 'Mathematics Problem Solving',
      prediction: 'Expected mastery in 3 weeks',
      confidence: 78,
      status: 'attention'
    },
    {
      title: 'Performance Trend',
      description: 'Overall Learning Progress',
      prediction: 'Accelerating improvement',
      confidence: 89,
      status: 'excellent'
    }
  ]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-100 text-green-800';
      case 'on-track':
        return 'bg-blue-100 text-blue-800';
      case 'attention':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center">
              <BarChart3 className="mr-3 h-10 w-10 text-zambia-copper" />
              Learning Analytics
            </h1>
            <p className="text-xl text-gray-600">Detailed insights into your learning journey</p>
          </div>
          
          <div className="flex space-x-2">
            {['week', 'month', 'semester'].map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "outline"}
                onClick={() => setTimeRange(range)}
                className={timeRange === range ? "bg-zambia-copper hover:bg-orange-600" : ""}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-8 w-8 text-zambia-copper" />
                <div>
                  <div className="text-2xl font-bold">{analyticsData.totalStudyTime}h</div>
                  <div className="text-sm text-gray-600">Total Study Time</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Target className="h-8 w-8 text-zambia-emerald" />
                <div>
                  <div className="text-2xl font-bold">{analyticsData.averageScore}%</div>
                  <div className="text-sm text-gray-600">Average Score</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-8 w-8 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{analyticsData.streakDays}</div>
                  <div className="text-sm text-gray-600">Day Streak</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-8 w-8 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold">{analyticsData.coursesCompleted}</div>
                  <div className="text-sm text-gray-600">Completed Courses</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Engagement Patterns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="mr-2 h-5 w-5" />
                Daily Engagement Pattern
              </CardTitle>
              <CardDescription>Study hours and engagement levels this week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {engagementData.map((day) => (
                  <div key={day.day} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{day.day}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{day.hours}h</span>
                        <Badge variant="secondary">{day.engagement}%</Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Progress value={(day.hours / 4) * 100} className="h-2" />
                      <Progress value={day.engagement} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Skill Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="mr-2 h-5 w-5" />
                Skill Development
              </CardTitle>
              <CardDescription>Current progress toward your skill targets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {skillProgress.map((skill, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">{skill.skill}</span>
                      <div className="flex items-center space-x-2">
                        {getTrendIcon(skill.trend)}
                        <span className="text-sm text-gray-600">
                          {skill.current}%/{skill.target}%
                        </span>
                      </div>
                    </div>
                    <Progress value={skill.current} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Learning Patterns & Predictions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Learning Patterns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="mr-2 h-5 w-5" />
                AI-Detected Learning Patterns
              </CardTitle>
              <CardDescription>Insights about your learning behavior</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {learningPatterns.map((pattern, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <pattern.icon className="h-6 w-6 text-zambia-copper" />
                    <div>
                      <div className="font-medium text-sm">{pattern.pattern}</div>
                      <div className="text-sm text-gray-600">{pattern.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Predictions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                AI Performance Predictions
              </CardTitle>
              <CardDescription>Machine learning insights about your progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predictions.map((prediction, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-sm">{prediction.title}</h4>
                        <p className="text-xs text-gray-600">{prediction.description}</p>
                      </div>
                      <Badge className={getStatusColor(prediction.status)}>
                        {prediction.confidence}% confidence
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-zambia-copper">
                      {prediction.prediction}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Heatmap Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="mr-2 h-5 w-5" />
              Content Interaction Heatmap
            </CardTitle>
            <CardDescription>Visual representation of how you interact with different content types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2 h-32">
              {Array.from({ length: 35 }, (_, i) => (
                <div 
                  key={i} 
                  className={`rounded aspect-square ${
                    Math.random() > 0.7 ? 'bg-zambia-copper' :
                    Math.random() > 0.4 ? 'bg-zambia-copper/60' :
                    Math.random() > 0.2 ? 'bg-zambia-copper/30' :
                    'bg-gray-100'
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
              <span>Less interaction</span>
              <span>More interaction</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LearningAnalytics;
