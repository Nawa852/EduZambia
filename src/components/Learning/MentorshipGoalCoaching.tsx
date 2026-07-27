
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Target, Users, Calendar, MessageSquare, Video, Phone,
  Award, TrendingUp, Clock, CheckCircle, Star, Zap,
  BookOpen, Brain, Heart, Handshake, Plus, ArrowRight
} from 'lucide-react';

const MentorshipGoalCoaching = () => {
  const [goals, setGoals] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [newGoal, setNewGoal] = useState({ title: '', description: '', deadline: '', category: '' });

  const sampleGoals = [
    {
      id: 1,
      title: 'Master Quadratic Equations',
      description: 'Complete all exercises and pass the chapter test with 85%+',
      progress: 75,
      deadline: '2025-07-15',
      category: 'Mathematics',
      status: 'in-progress',
      milestones: [
        { text: 'Complete basic theory', completed: true },
        { text: 'Solve 50 practice problems', completed: true },
        { text: 'Take practice test', completed: false },
        { text: 'Final chapter assessment', completed: false }
      ]
    },
    {
      id: 2,
      title: 'Improve English Writing',
      description: 'Write 10 essays and improve grade from C to B+',
      progress: 60,
      deadline: '2025-08-01',
      category: 'English',
      status: 'in-progress',
      milestones: [
        { text: 'Read grammar guide', completed: true },
        { text: 'Write 5 practice essays', completed: true },
        { text: 'Get teacher feedback', completed: false },
        { text: 'Complete final essays', completed: false }
      ]
    },
    {
      id: 3,
      title: 'Biology Study Plan',
      description: 'Complete Grade 12 Biology syllabus preparation',
      progress: 100,
      deadline: '2025-06-30',
      category: 'Biology',
      status: 'completed',
      milestones: [
        { text: 'Cell biology chapters', completed: true },
        { text: 'Genetics and heredity', completed: true },
        { text: 'Ecology and environment', completed: true },
        { text: 'Final revision', completed: true }
      ]
    }
  ];

  const sampleMentors = [
    {
      id: 1,
      name: 'Dr. Sarah Mwanza',
      expertise: ['Mathematics', 'Physics'],
      rating: 4.9,
      students: 45,
      avatar: '/api/placeholder/64/64',
      bio: 'Mathematics lecturer at University of Zambia with 10+ years of teaching experience.',
      availability: 'Weekends',
      status: 'available'
    },
    {
      id: 2,
      name: 'Mr. James Phiri',
      expertise: ['English', 'Literature'],
      rating: 4.8,
      students: 32,
      avatar: '/api/placeholder/64/64',
      bio: 'Former high school teacher, now helping students excel in language arts.',
      availability: 'Evenings',
      status: 'busy'
    },
    {
      id: 3,
      name: 'Ms. Grace Banda',
      expertise: ['Biology', 'Chemistry'],
      rating: 4.9,
      students: 28,
      avatar: '/api/placeholder/64/64',
      bio: 'Science teacher with expertise in ECZ curriculum and exam preparation.',
      availability: 'Flexible',
      status: 'available'
    }
  ];

  const upcomingSessions = [
    {
      id: 1,
      mentor: 'Dr. Sarah Mwanza',
      subject: 'Mathematics - Quadratic Equations',
      date: '2025-07-02',
      time: '14:00',
      type: 'video',
      status: 'confirmed'
    },
    {
      id: 2,
      mentor: 'Ms. Grace Banda',
      subject: 'Biology - Cell Structure Review',
      date: '2025-07-04',
      time: '16:00',
      type: 'chat',
      status: 'pending'
    }
  ];

  useEffect(() => {
    setGoals(sampleGoals);
    setMentors(sampleMentors);
  }, []);

  const handleCreateGoal = () => {
    if (newGoal.title && newGoal.description) {
      const goal = {
        id: goals.length + 1,
        ...newGoal,
        progress: 0,
        status: 'in-progress',
        milestones: []
      };
      setGoals([...goals, goal]);
      setNewGoal({ title: '', description: '', deadline: '', category: '' });
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in-progress': return 'text-blue-600 bg-blue-100';
      case 'overdue': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const GoalCard = ({ goal }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{goal.title}</CardTitle>
          <Badge className={getStatusColor(goal.status)}>
            {goal.status.replace('-', ' ')}
          </Badge>
        </div>
        <p className="text-gray-600">{goal.description}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Progress</span>
              <span>{goal.progress}%</span>
            </div>
            <Progress value={goal.progress} />
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Due: {new Date(goal.deadline).toLocaleDateString()}</span>
            </div>
            <Badge variant="outline">{goal.category}</Badge>
          </div>

          {goal.milestones && goal.milestones.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Milestones</h4>
              <div className="space-y-2">
                {goal.milestones.map((milestone, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircle className={`w-4 h-4 ${milestone.completed ? 'text-green-500' : 'text-gray-300'}`} />
                    <span className={`text-sm ${milestone.completed ? 'line-through text-gray-500' : ''}`}>
                      {milestone.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const MentorCard = ({ mentor }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={mentor.avatar} />
            <AvatarFallback>{mentor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">{mentor.name}</h3>
              <Badge className={mentor.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                {mentor.status}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4 mb-3 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-500" />
                <span>{mentor.rating}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{mentor.students} students</span>
              </div>
            </div>
            
            <p className="text-gray-600 mb-3">{mentor.bio}</p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {mentor.expertise.map((skill, index) => (
                <Badge key={index} variant="outline">{skill}</Badge>
              ))}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <Clock className="w-4 h-4 inline mr-1" />
                {mentor.availability}
              </div>
              <div className="space-x-2">
                <Button size="sm" variant="outline">
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Message
                </Button>
                <Button size="sm" disabled={mentor.status !== 'available'}>
                  <Handshake className="w-4 h-4 mr-1" />
                  Connect
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Mentorship & Goal Coaching</h1>
          <p className="text-gray-600">Set learning goals and connect with expert mentors</p>
        </div>

        <Tabs defaultValue="goals" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="goals" className="flex items-center space-x-2">
              <Target className="w-4 h-4" />
              <span>My Goals</span>
            </TabsTrigger>
            <TabsTrigger value="mentors" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Find Mentors</span>
            </TabsTrigger>
            <TabsTrigger value="sessions" className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Sessions</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="goals" className="space-y-6">
            {/* Create New Goal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="w-5 h-5" />
                  <span>Create New Goal</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Goal title"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                  />
                  <select
                    className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newGoal.category}
                    onChange={(e) => setNewGoal({...newGoal, category: e.target.value})}
                  >
                    <option value="">Select Category</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="English">English</option>
                    <option value="Biology">Biology</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Physics">Physics</option>
                  </select>
                  <Textarea
                    placeholder="Goal description"
                    value={newGoal.description}
                    onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                    className="md:col-span-2"
                  />
                  <Input
                    type="date"
                    value={newGoal.deadline}
                    onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value})}
                  />
                  <Button onClick={handleCreateGoal} className="md:col-span-2">
                    Create Goal
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Goals Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <Target className="w-8 h-8 text-blue-600" />
                    <div>
                      <div className="text-2xl font-bold">{goals.length}</div>
                      <div className="text-sm text-gray-600">Total Goals</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    <div>
                      <div className="text-2xl font-bold">{goals.filter(g => g.status === 'completed').length}</div>
                      <div className="text-sm text-gray-600">Completed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-8 h-8 text-orange-600" />
                    <div>
                      <div className="text-2xl font-bold">{goals.filter(g => g.status === 'in-progress').length}</div>
                      <div className="text-sm text-gray-600">In Progress</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="w-8 h-8 text-purple-600" />
                    <div>
                      <div className="text-2xl font-bold">
                        {Math.round(goals.reduce((acc, goal) => acc + goal.progress, 0) / goals.length) || 0}%
                      </div>
                      <div className="text-sm text-gray-600">Avg Progress</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Goals List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {goals.map(goal => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="mentors" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Available Mentors</h2>
                <p className="text-gray-600">Connect with expert educators and peers</p>
              </div>
              <Button className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Become a Mentor</span>
              </Button>
            </div>

            <div className="space-y-6">
              {mentors.map(mentor => (
                <MentorCard key={mentor.id} mentor={mentor} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Upcoming Sessions */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Upcoming Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {upcomingSessions.map(session => (
                      <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className={`w-3 h-3 rounded-full ${session.status === 'confirmed' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                          <div>
                            <h3 className="font-semibold">{session.subject}</h3>
                            <p className="text-sm text-gray-600">with {session.mentor}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(session.date).toLocaleDateString()} at {session.time}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {session.type === 'video' ? <Video className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                          <Button size="sm" variant="outline">
                            {session.status === 'confirmed' ? 'Join' : 'Confirm'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Session Stats */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Session Stats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Sessions</span>
                        <span className="font-semibold">12</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">This Month</span>
                        <span className="font-semibold">4</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Avg Rating</span>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="font-semibold">4.8</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button className="w-full">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule New Session
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MentorshipGoalCoaching;
