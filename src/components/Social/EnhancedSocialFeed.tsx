import React, { useState, useEffect } from 'react';
import { CreatePost } from './CreatePost';
import { FacebookStylePost, type Post } from './FacebookStylePost';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  MapPin, 
  Star,
  BookOpen,
  Award,
  Sparkles,
  Clock,
  Globe,
  Eye,
  Zap,
  Brain,
  Target,
  Trophy,
  Flame,
  Heart,
  MessageCircle,
  Share2
} from 'lucide-react';

interface Story {
  id: string;
  author: {
    name: string;
    avatar: string;
  };
  image: string;
  timestamp: string;
  viewed: boolean;
}

interface TrendingTopic {
  id: string;
  title: string;
  posts: number;
  trend: 'up' | 'down' | 'stable';
}

interface SuggestedFriend {
  id: string;
  name: string;
  avatar: string;
  mutualFriends: number;
  title: string;
}

interface LiveEvent {
  id: string;
  title: string;
  host: string;
  viewers: number;
  startTime: string;
  subject: string;
}

const EnhancedSocialFeed = () => {
  const [feedFilter, setFeedFilter] = useState('all');
  const [posts, setPosts] = useState<Post[]>([
    {
      id: '1',
      author: {
        name: 'Sarah Mwamba',
        avatar: '/avatar1.jpg',
        title: 'Computer Science Student',
        location: 'University of Zambia',
        isVerified: true,
        mutualFriends: 12
      },
      content: 'Just completed my AI project on predicting student performance! 🎓 The model achieved 94% accuracy using ensemble methods. Excited to share my findings with the class tomorrow. Thanks to everyone who helped with data collection! #MachineLearning #AI #UniversityOfZambia',
      images: ['/project1.jpg', '/project2.jpg'],
      timestamp: '2 hours ago',
      reactions: [
        { type: 'like' as const, emoji: '👍', count: 45, hasReacted: false },
        { type: 'love' as const, emoji: '❤️', count: 12, hasReacted: true },
        { type: 'haha' as const, emoji: '😂', count: 2, hasReacted: false },
        { type: 'wow' as const, emoji: '😮', count: 8, hasReacted: false },
        { type: 'sad' as const, emoji: '😢', count: 0, hasReacted: false },
        { type: 'angry' as const, emoji: '😡', count: 0, hasReacted: false }
      ],
      comments: [
        {
          id: 'c1',
          author: { name: 'Dr. Kabwe', avatar: '/teacher1.jpg' },
          content: 'Excellent work Sarah! Would love to see your methodology.',
          timestamp: '1 hour ago',
          likes: 5
        },
        {
          id: 'c2',
          author: { name: 'James Banda', avatar: '/student1.jpg' },
          content: 'Wow! Can you share your dataset? Working on similar project.',
          timestamp: '45 minutes ago',
          likes: 3
        }
      ],
      shares: 8,
      views: 156,
      privacy: 'public' as const,
      isLiked: true,
      isSaved: false,
      subject: 'Computer Science',
      tags: ['AI', 'MachineLearning', 'DataScience'],
      feeling: 'accomplished',
      mentionedUsers: ['Dr. Kabwe', 'Research Team']
    },
    {
      id: '2',
      author: {
        name: 'Copperbelt University',
        avatar: '/cbu-logo.jpg',
        title: 'Educational Institution',
        isVerified: true
      },
      content: 'Applications are now open for our new Digital Innovation Bootcamp! 🚀 Learn coding, AI, and entrepreneurship skills. Scholarships available for outstanding Zambian students. Apply before March 15th.',
      link: {
        url: 'https://cbu.ac.zm/bootcamp',
        title: 'Digital Innovation Bootcamp - Copperbelt University',
        description: 'Transform your future with cutting-edge technology skills',
        image: '/bootcamp-banner.jpg'
      },
      timestamp: '4 hours ago',
      reactions: [
        { type: 'like' as const, emoji: '👍', count: 89, hasReacted: false },
        { type: 'love' as const, emoji: '❤️', count: 23, hasReacted: false },
        { type: 'haha' as const, emoji: '😂', count: 1, hasReacted: false },
        { type: 'wow' as const, emoji: '😮', count: 15, hasReacted: false },
        { type: 'sad' as const, emoji: '😢', count: 0, hasReacted: false },
        { type: 'angry' as const, emoji: '😡', count: 0, hasReacted: false }
      ],
      comments: [
        {
          id: 'c3',
          author: { name: 'Mary Lungu', avatar: '/student2.jpg' },
          content: 'This is exactly what I was looking for! Already applied 📝',
          timestamp: '2 hours ago',
          likes: 12
        }
      ],
      shares: 34,
      views: 432,
      privacy: 'public' as const,
      isLiked: false,
      isSaved: true,
      subject: 'Technology',
      tags: ['Bootcamp', 'Innovation', 'Scholarships']
    }
  ]);

  const stories: Story[] = [
    {
      id: 's1',
      author: { name: 'Your Story', avatar: '/you.jpg' },
      image: '/story-placeholder.jpg',
      timestamp: '',
      viewed: false
    },
    {
      id: 's2',
      author: { name: 'Chanda Mulenga', avatar: '/friend1.jpg' },
      image: '/story1.jpg',
      timestamp: '2h',
      viewed: false
    },
    {
      id: 's3',
      author: { name: 'UNZA Alumni', avatar: '/unza-logo.jpg' },
      image: '/story2.jpg',
      timestamp: '5h',
      viewed: true
    }
  ];

  const trendingTopics: TrendingTopic[] = [
    { id: 't1', title: '#ZambianTech', posts: 1247, trend: 'up' },
    { id: 't2', title: '#StudyTogether', posts: 892, trend: 'up' },
    { id: 't3', title: '#UniversityLife', posts: 634, trend: 'stable' },
    { id: 't4', title: '#CodingChallenge', posts: 423, trend: 'up' }
  ];

  const suggestedFriends: SuggestedFriend[] = [
    {
      id: 'sf1',
      name: 'Peter Simusokwe',
      avatar: '/friend2.jpg',
      mutualFriends: 8,
      title: 'Engineering Student'
    },
    {
      id: 'sf2',
      name: 'Grace Tembo',
      avatar: '/friend3.jpg',
      mutualFriends: 15,
      title: 'Medical Student'
    }
  ];

  const liveEvents: LiveEvent[] = [
    {
      id: 'le1',
      title: 'Python Programming Workshop',
      host: 'Dr. Mutale Chanda',
      viewers: 234,
      startTime: 'Now',
      subject: 'Computer Science'
    },
    {
      id: 'le2',
      title: 'Career Guidance Session',
      host: 'Alumni Network',
      viewers: 89,
      startTime: '3:00 PM',
      subject: 'Career Development'
    }
  ];

  const handleCreatePost = (postData: any) => {
    const newPost = {
      id: `post-${Date.now()}`,
      author: {
        name: 'You',
        avatar: '/your-avatar.jpg',
        title: 'Student',
        location: 'Zambia',
        isVerified: false,
        mutualFriends: 0
      },
      content: postData.content,
      images: postData.images || [],
      timestamp: 'just now',
      reactions: [
        { type: 'like' as const, emoji: '👍', count: 0, hasReacted: false },
        { type: 'love' as const, emoji: '❤️', count: 0, hasReacted: false },
        { type: 'haha' as const, emoji: '😂', count: 0, hasReacted: false },
        { type: 'wow' as const, emoji: '😮', count: 0, hasReacted: false },
        { type: 'sad' as const, emoji: '😢', count: 0, hasReacted: false },
        { type: 'angry' as const, emoji: '😡', count: 0, hasReacted: false }
      ],
      comments: [],
      shares: 0,
      views: 0,
      privacy: 'public' as const,
      isLiked: false,
      isSaved: false,
      subject: postData.subject,
      tags: postData.tags || []
    };
    setPosts([newPost, ...posts]);
  };

  return (
    <div className="w-full space-y-6">
      {/* Stories Section */}
      <Card className="glass-card border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Stories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {stories.map((story) => (
              <div
                key={story.id}
                className="flex-shrink-0 relative cursor-pointer hover-lift transition-all duration-300"
              >
                <div className={`w-20 h-20 rounded-2xl overflow-hidden border-2 ${
                  story.id === 's1' 
                    ? 'border-dashed border-primary' 
                    : story.viewed 
                      ? 'border-gray-300' 
                      : 'border-primary'
                }`}>
                  <img
                    src={story.image}
                    alt={story.author.name}
                    className="w-full h-full object-cover"
                  />
                  {story.id === 's1' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-primary/80 text-white text-2xl">
                      +
                    </div>
                  )}
                </div>
                <p className="text-xs text-center mt-1 font-medium truncate w-20">
                  {story.author.name}
                </p>
                {story.timestamp && (
                  <p className="text-xs text-center text-muted-foreground">
                    {story.timestamp}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Trending Topics */}
          <Card className="glass-card border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
                Trending in Education
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {trendingTopics.map((topic) => (
                <div key={topic.id} className="flex items-center justify-between hover:bg-muted/50 p-2 rounded-lg transition-colors cursor-pointer">
                  <div>
                    <p className="font-medium text-sm">{topic.title}</p>
                    <p className="text-xs text-muted-foreground">{topic.posts.toLocaleString()} posts</p>
                  </div>
                  <div className={`flex items-center ${
                    topic.trend === 'up' ? 'text-green-500' : topic.trend === 'down' ? 'text-red-500' : 'text-gray-500'
                  }`}>
                    <TrendingUp className={`h-3 w-3 ${topic.trend === 'down' ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Live Events */}
          <Card className="glass-card border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5 text-red-500" />
                Live Events
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {liveEvents.map((event) => (
                <div key={event.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-red-500">LIVE</span>
                  </div>
                  <h4 className="font-semibold text-sm">{event.title}</h4>
                  <p className="text-xs text-muted-foreground">by {event.host}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span className="text-xs">{event.viewers}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {event.subject}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Feed Filters */}
          <Tabs value={feedFilter} onValueChange={setFeedFilter}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                All
              </TabsTrigger>
              <TabsTrigger value="friends" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Friends
              </TabsTrigger>
              <TabsTrigger value="study" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Study
              </TabsTrigger>
              <TabsTrigger value="achievements" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Achievements
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Create Post */}
          <CreatePost onSubmit={handleCreatePost} />

          {/* Posts Feed */}
          <div className="space-y-6">
            {posts.map((post) => (
              <FacebookStylePost
                key={post.id}
                post={post}
                onLike={(postId) => console.log('Liked post:', postId)}
                onComment={(postId, comment) => console.log('Commented on post:', postId, comment)}
                onShare={(postId) => console.log('Shared post:', postId)}
                onSave={(postId) => console.log('Saved post:', postId)}
              />
            ))}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Suggested Friends */}
          <Card className="glass-card border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" />
                People You May Know
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {suggestedFriends.map((friend) => (
                <div key={friend.id} className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={friend.avatar} alt={friend.name} />
                    <AvatarFallback className="gradient-bright-sphere text-white">
                      {friend.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{friend.name}</h4>
                    <p className="text-xs text-muted-foreground">{friend.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {friend.mutualFriends} mutual connections
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        Add Friend
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs">
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="glass-card border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-primary" />
                Your Progress Today
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Lessons Completed</span>
                </div>
                <Badge variant="secondary">3/5</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">Study Streak</span>
                </div>
                <Badge variant="secondary">7 days</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">Achievements</span>
                </div>
                <Badge variant="secondary">12</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Study Time</span>
                </div>
                <Badge variant="secondary">2.5h</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSocialFeed;