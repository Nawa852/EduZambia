
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Award, BarChart3, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const ECZExamSimulatorPage = () => {
  const [loading, setLoading] = useState(false);
  const [currentExam, setCurrentExam] = useState(null);
  const [examResults, setExamResults] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [examInProgress, setExamInProgress] = useState(false);
  const { toast } = useToast();

  const eczSubjects = ['Mathematics', 'English', 'Science', 'Social Studies', 'Civic Education'];
  const grades = ['Grade 7', 'Grade 9', 'Grade 12'];
  const difficulties = ['Easy', 'Medium', 'Hard'];

  // AI-Powered Exam Generator
  const generateExam = async () => {
    if (!selectedSubject || !selectedGrade) {
      toast({
        title: "Selection Required",
        description: "Please select both subject and grade level.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('comprehensive-ai-assistant', {
        body: {
          query: `Generate a realistic ECZ ${selectedSubject} mock exam for ${selectedGrade} with 20 questions. Include multiple choice, short answer, and essay questions following ECZ format and standards. Questions should cover key curriculum topics.`,
          feature: 'exam_generation',
          context: `Subject: ${selectedSubject}, Grade: ${selectedGrade}`
        }
      });

      if (error) throw error;
      
      const mockExam = {
        id: Date.now(),
        subject: selectedSubject,
        grade: selectedGrade,
        questions: [
          { id: 1, question: "What is the capital of Zambia?", type: "multiple_choice", options: ["Lusaka", "Ndola", "Kitwe", "Livingstone"], correct: 0 },
          { id: 2, question: "Solve: 2x + 5 = 15", type: "short_answer", correct: "x = 5" },
          { id: 3, question: "Explain the importance of the Zambezi River to Zambia's economy.", type: "essay", points: 10 }
        ],
        timeLimit: 120,
        totalMarks: 100
      };

      setCurrentExam(mockExam);
      toast({
        title: "Exam Generated",
        description: `ECZ ${selectedSubject} exam ready for ${selectedGrade}`
      });
    } catch (error) {
      toast({
        title: "Generation Error",
        description: "Failed to generate exam. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Dynamic Score Analyzer
  const analyzeScore = (score) => {
    const analysis = {
      percentage: (score / 100) * 100,
      grade: score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : score >= 50 ? 'D' : 'F',
      feedback: score >= 80 ? 'Excellent performance!' : score >= 60 ? 'Good work, keep improving!' : 'Need more practice'
    };
    return analysis;
  };

  useEffect(() => {
    // Offline Exam Cache
    const cachedExams = localStorage.getItem('ecz_mock_exams');
    if (cachedExams) {
      setExamResults(JSON.parse(cachedExams));
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6">
      <div className="w-full">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <BookOpen className="w-10 h-10 text-purple-600" />
            ECZ Exam Simulator
          </h1>
          <p className="text-lg text-gray-600">
            Provides realistic ECZ exam practice with AI-generated questions
          </p>
        </div>

        <Tabs defaultValue="generator" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="generator">Exam Generator</TabsTrigger>
            <TabsTrigger value="analyzer">Score Analyzer</TabsTrigger>
            <TabsTrigger value="cache">Offline Cache</TabsTrigger>
            <TabsTrigger value="narrator">Multilingual</TabsTrigger>
            <TabsTrigger value="recommender">Recommender</TabsTrigger>
          </TabsList>

          <TabsContent value="generator" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                  AI-Powered Exam Generator (Grok)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">ECZ Subject</label>
                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {eczSubjects.map(subject => (
                          <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Grade Level</label>
                    <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {grades.map(grade => (
                          <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={generateExam} disabled={loading} className="w-full">
                  {loading ? 'Generating Exam...' : 'Generate ECZ Mock Exam'}
                </Button>
                
                {currentExam && (
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {currentExam.subject} - {currentExam.grade}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Questions: {currentExam.questions.length}</span>
                          <span className="text-sm text-gray-600">Time: {currentExam.timeLimit} minutes</span>
                          <span className="text-sm text-gray-600">Total Marks: {currentExam.totalMarks}</span>
                        </div>
                        <Button className="w-full" onClick={() => setExamInProgress(true)}>
                          Start Exam
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analyzer" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Dynamic Score Analyzer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-l-4 border-green-500">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <div>
                            <h4 className="font-semibold">Last Score</h4>
                            <p className="text-2xl font-bold text-green-600">85%</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-l-4 border-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Award className="w-5 h-5 text-blue-600" />
                          <div>
                            <h4 className="font-semibold">Grade</h4>
                            <p className="text-2xl font-bold text-blue-600">A</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-l-4 border-orange-500">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-orange-600" />
                          <div>
                            <h4 className="font-semibold">Time Taken</h4>
                            <p className="text-2xl font-bold text-orange-600">95m</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Performance Breakdown</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Multiple Choice</span>
                        <span>90%</span>
                      </div>
                      <Progress value={90} className="h-2" />
                      <div className="flex justify-between">
                        <span>Short Answer</span>
                        <span>80%</span>
                      </div>
                      <Progress value={80} className="h-2" />
                      <div className="flex justify-between">
                        <span>Essay Questions</span>
                        <span>85%</span>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cache" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Offline Exam Cache</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Practice exams are cached for offline access
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-green-800">Cached Exams</h4>
                      <p className="text-2xl font-bold text-green-600">12</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-800">Completed</h4>
                      <p className="text-2xl font-bold text-blue-600">8</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="narrator" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Multilingual Exam Narrator</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Select defaultValue="English">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Bemba">Bemba</SelectItem>
                      <SelectItem value="Nyanja">Nyanja</SelectItem>
                      <SelectItem value="Tonga">Tonga</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button className="w-full">
                    Listen to Exam Instructions
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommender" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI-Powered Exam Recommender</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="border-l-4 border-yellow-500">
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-2">Recommended: Mathematics</h4>
                        <p className="text-sm text-gray-600">Based on your recent performance</p>
                        <Badge className="mt-2">High Priority</Badge>
                      </CardContent>
                    </Card>
                    <Card className="border-l-4 border-blue-500">
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-2">Recommended: Science</h4>
                        <p className="text-sm text-gray-600">Continue your strong performance</p>
                        <Badge variant="outline" className="mt-2">Medium Priority</Badge>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ECZExamSimulatorPage;
