import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/components/Auth/AuthProvider';
import { BarChart3, TrendingUp, Clock, Target, Award, Brain } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const LearningAnalytics = () => {
  const { user, isDemo } = useAuth();


  // Mock data for demonstration
  const weeklyProgress = [
    { day: 'Mon', hours: 2.5, performance: 85 },
    { day: 'Tue', hours: 3.2, performance: 78 },
    { day: 'Wed', hours: 1.8, performance: 92 },
    { day: 'Thu', hours: 4.1, performance: 88 },
    { day: 'Fri', hours: 2.9, performance: 95 },
    { day: 'Sat', hours: 3.5, performance: 82 },
    { day: 'Sun', hours: 2.2, performance: 90 },
  ];

  const subjectDistribution = [
    { name: 'Mathematics', value: 35, color: '#3B82F6' },
    { name: 'Physics', value: 25, color: '#10B981' },
    { name: 'Chemistry', value: 20, color: '#F59E0B' },
    { name: 'Biology', value: 20, color: '#EF4444' },
  ];

  const monthlyTrend = [
    { month: 'Jan', studyHours: 45, quizScore: 78 },
    { month: 'Feb', studyHours: 52, quizScore: 82 },
    { month: 'Mar', studyHours: 48, quizScore: 85 },
    { month: 'Apr', studyHours: 61, quizScore: 88 },
    { month: 'May', studyHours: 55, quizScore: 91 },
    { month: 'Jun', studyHours: 67, quizScore: 89 },
  ];

  const stats = [
    { title: "Total Study Hours", value: "156", icon: Clock, color: "text-blue-600", change: "+12%" },
    { title: "Average Score", value: "87%", icon: Target, color: "text-green-600", change: "+5%" },
    { title: "Streak Days", value: "23", icon: TrendingUp, color: "text-purple-600", change: "+3 days" },
    { title: "Achievements", value: "15", icon: Award, color: "text-yellow-600", change: "+2" },
  ];

  if (!isDemo) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-blue-600" />
                Learning Analytics
              </CardTitle>
              <CardDescription>
                Your analytics will populate as you complete lessons, quizzes and focus sessions. Start studying to see real insights here.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              Learning Analytics Dashboard <span className="text-xs font-normal text-muted-foreground">(Demo data)</span>
            </CardTitle>
            <CardDescription>
              Track your learning progress and performance insights
            </CardDescription>
          </CardHeader>
        </Card>


        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-green-600 font-medium">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Progress Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Study Pattern</CardTitle>
              <CardDescription>Hours studied and performance this week</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyProgress}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="hours" fill="#3B82F6" name="Hours" />
                  <Line yAxisId="right" type="monotone" dataKey="performance" stroke="#10B981" strokeWidth={2} name="Performance %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Subject Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Subject Focus Distribution</CardTitle>
              <CardDescription>Time allocation across subjects</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={subjectDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {subjectDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>6-Month Learning Trend</CardTitle>
            <CardDescription>Study hours and quiz performance over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Bar yAxisId="left" dataKey="studyHours" fill="#3B82F6" name="Study Hours" />
                <Line yAxisId="right" type="monotone" dataKey="quizScore" stroke="#EF4444" strokeWidth={3} name="Quiz Score %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Learning Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900">Strength Areas</h4>
                <p className="text-sm text-blue-700 mt-1">
                  You excel in Chemistry with 91% average score. Your consistent daily study habit is paying off!
                </p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-900">Areas for Improvement</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Consider increasing Physics study time. Your performance could improve with more practice problems.
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900">Recommendations</h4>
                <p className="text-sm text-green-700 mt-1">
                  Your learning pattern shows peak performance on Fridays. Schedule important topics for Thursday-Friday sessions.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Learning Goals Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Complete Calculus Course</span>
                  <span>75%</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Master Organic Chemistry</span>
                  <span>60%</span>
                </div>
                <Progress value={60} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Physics Problem Solving</span>
                  <span>45%</span>
                </div>
                <Progress value={45} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Study Streak Goal (30 days)</span>
                  <span>77%</span>
                </div>
                <Progress value={77} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LearningAnalytics;
