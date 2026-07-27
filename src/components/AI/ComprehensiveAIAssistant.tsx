
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Upload, 
  Mic, 
  MicOff, 
  Send, 
  FileText, 
  Image, 
  Video, 
  Volume2,
  Globe,
  Brain,
  Eye,
  MessageSquare,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Lightbulb,
  Target,
  Zap
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  language?: string;
  audioUrl?: string;
  recommendations?: string[];
  metadata?: any;
}

interface AssistantFeature {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  apiKey: string;
  isActive: boolean;
}

const ComprehensiveAIAssistant = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [activeFeatures, setActiveFeatures] = useState<string[]>([]);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const features: AssistantFeature[] = [
    {
      id: 'gpt4o',
      name: 'GPT-4o Tutor',
      description: 'Advanced tutoring and explanations',
      icon: Brain,
      apiKey: 'OPENAI_API_KEY',
      isActive: true
    },
    {
      id: 'deepseek',
      name: 'DeepSeek Analytics',
      description: 'Adaptive learning and analytics',
      icon: Target,
      apiKey: 'DEEPSEEK_API_KEY',
      isActive: true
    },
    {
      id: 'qwen',
      name: 'Qwen Translator',
      description: 'Multilingual support',
      icon: Globe,
      apiKey: 'QWEN_API_KEY',
      isActive: true
    },
    {
      id: 'grok',
      name: 'Grok Conversational',
      description: 'Conversational AI and voice',
      icon: MessageSquare,
      apiKey: 'GROCK_API_KEY',
      isActive: true
    },
    {
      id: 'kimi',
      name: 'Kimi Recommendations',
      description: 'Smart recommendations',
      icon: Lightbulb,
      apiKey: 'KIMI_AI_API_KEY',
      isActive: true
    },
    {
      id: 'gemini',
      name: 'Gemini Visuals',
      description: 'Visual content generation',
      icon: Eye,
      apiKey: 'gemini2.5_api_key',
      isActive: true
    },
    {
      id: 'minimax',
      name: 'MiniMax OCR',
      description: 'Document processing',
      icon: FileText,
      apiKey: 'MINIMAX_API_KEY',
      isActive: true
    },
    {
      id: 'gemma',
      name: 'Gemma Lightweight',
      description: 'Low-resource processing',
      icon: Zap,
      apiKey: 'GEMMA_API_KEY',
      isActive: true
    }
  ];

  const languages = [
    'English',
    'Bemba',
    'Nyanja',
    'Tonga',
    'Lozi',
    'Lunda',
    'Kaonde'
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Initialize with welcome message
    setMessages([{
      id: '1',
      role: 'assistant',
      content: `Muli bwanji! Welcome to Synapse's AI Study Assistant! I'm here to help you with your studies using advanced AI technology. I can:

• Answer questions in multiple Zambian languages
• Process documents and images
• Provide ECZ-aligned explanations
• Give personalized study recommendations
• Work offline when needed

How can I help you today?`,
      timestamp: new Date(),
      language: 'English'
    }]);
  }, []);

  const simulateAPICall = async (endpoint: string, data: any): Promise<any> => {
    // Simulate API processing time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Simulate different API responses based on endpoint
    switch (endpoint) {
      case 'ocr':
        return { text: 'Extracted text from document: Lorem ipsum dolor sit amet...' };
      case 'translate':
        return { text: `Translated to ${data.target}: ${data.text}` };
      case 'chat':
        return { 
          text: `AI Response: Based on your query about "${data.query}", here's a comprehensive explanation...`,
          recommendations: ['Practice more examples', 'Review chapter 3', 'Watch video tutorial']
        };
      case 'recommend':
        return { recommendations: ['Study Group: Math Grade 9', 'ECZ Past Papers', 'Khan Academy Videos'] };
      case 'summarize':
        return { text: 'Summary: Key points include...' };
      default:
        return { text: 'API response simulated' };
    }
  };

  const processWithAI = async (query: string, files: File[] = []) => {
    setIsLoading(true);
    setProcessingStatus('Initializing AI processing...');
    
    try {
      let processedContent = query;
      const responses: any = {};

      // Step 1: OCR for uploaded files
      if (files.length > 0) {
        setProcessingStatus('Extracting text from documents...');
        for (const file of files) {
          if (file.type.includes('pdf') || file.type.includes('image')) {
            const ocrResponse = await simulateAPICall('ocr', { file });
            responses.ocr = ocrResponse;
            processedContent += `\n\nDocument content: ${ocrResponse.text}`;
          }
        }
      }

      // Step 2: Translation if not English
      if (selectedLanguage !== 'English') {
        setProcessingStatus('Translating to English...');
        const translateResponse = await simulateAPICall('translate', {
          text: query,
          source: selectedLanguage,
          target: 'English'
        });
        responses.translation = translateResponse;
        processedContent = translateResponse.text;
      }

      // Step 3: Generate AI response
      setProcessingStatus('Generating AI response...');
      const chatResponse = await simulateAPICall('chat', {
        query: processedContent,
        context: 'ECZ curriculum',
        features: activeFeatures
      });
      responses.chat = chatResponse;

      // Step 4: Get recommendations
      if (activeFeatures.includes('kimi')) {
        setProcessingStatus('Getting recommendations...');
        const recommendResponse = await simulateAPICall('recommend', {
          query: processedContent
        });
        responses.recommendations = recommendResponse;
      }

      // Step 5: Summarize for low-resource devices
      if (activeFeatures.includes('gemma')) {
        setProcessingStatus('Optimizing for low-bandwidth...');
        const summaryResponse = await simulateAPICall('summarize', {
          text: chatResponse.text
        });
        responses.summary = summaryResponse;
      }

      // Step 6: Translate back to user language
      let finalResponse = responses.summary?.text || chatResponse.text;
      if (selectedLanguage !== 'English') {
        setProcessingStatus('Translating response...');
        const finalTranslation = await simulateAPICall('translate', {
          text: finalResponse,
          source: 'English',
          target: selectedLanguage
        });
        finalResponse = finalTranslation.text;
      }

      // Create response message
      const responseMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: finalResponse,
        timestamp: new Date(),
        language: selectedLanguage,
        recommendations: responses.recommendations?.recommendations || responses.chat?.recommendations,
        metadata: {
          featuresUsed: activeFeatures,
          processingTime: '3.2s',
          apis: Object.keys(responses)
        }
      };

      setMessages(prev => [...prev, responseMessage]);
      setProcessingStatus('');

      toast({
        title: "AI Processing Complete",
        description: `Response generated using ${Object.keys(responses).length} AI services`,
      });

    } catch (error) {
      console.error('AI processing error:', error);
      
      // Fallback to offline mode
      if (!isOfflineMode) {
        setProcessingStatus('Switching to offline mode...');
        const offlineResponse = await simulateAPICall('offline', { query });
        
        const responseMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `[Offline Mode] ${offlineResponse.text}`,
          timestamp: new Date(),
          language: selectedLanguage,
          metadata: { mode: 'offline' }
        };

        setMessages(prev => [...prev, responseMessage]);
      }

      toast({
        title: "Processing Error",
        description: "Switched to offline mode for continued assistance",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setProcessingStatus('');
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() && uploadedFiles.length === 0) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText || '[File uploaded]',
      timestamp: new Date(),
      language: selectedLanguage
    };

    setMessages(prev => [...prev, userMessage]);
    
    await processWithAI(inputText, uploadedFiles);
    
    setInputText('');
    setUploadedFiles([]);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
    
    toast({
      title: "Files Uploaded",
      description: `${files.length} file(s) ready for processing`,
    });
  };

  const toggleFeature = (featureId: string) => {
    setActiveFeatures(prev => 
      prev.includes(featureId)
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    );
  };

  const startVoiceRecording = () => {
    setIsListening(true);
    // Simulate voice recording
    setTimeout(() => {
      setIsListening(false);
      setInputText("Explain quadratic equations in Bemba");
      toast({
        title: "Voice Captured",
        description: "Speech converted to text successfully",
      });
    }, 3000);
  };

  return (
    <div className="w-full p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-4">
          Synapse AI Study Assistant
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Advanced AI-powered learning with multilingual support, document processing, and ECZ-aligned content
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* AI Features Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              AI Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Language</label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map(lang => (
                    <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Active AI Services</label>
              <div className="space-y-2">
                {features.map(feature => (
                  <div key={feature.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <feature.icon className="w-4 h-4" />
                      <div>
                        <p className="text-sm font-medium">{feature.name}</p>
                        <p className="text-xs text-gray-500">{feature.description}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={activeFeatures.includes(feature.id) ? "default" : "outline"}
                      onClick={() => toggleFeature(feature.id)}
                    >
                      {activeFeatures.includes(feature.id) ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Mode</label>
              <Button
                variant={isOfflineMode ? "default" : "outline"}
                onClick={() => setIsOfflineMode(!isOfflineMode)}
                className="w-full"
              >
                {isOfflineMode ? 'Offline Mode' : 'Online Mode'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Chat Interface */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>AI Chat Assistant</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{selectedLanguage}</Badge>
                <Badge variant={isOfflineMode ? "destructive" : "default"}>
                  {isOfflineMode ? 'Offline' : 'Online'}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Chat Messages */}
            <div className="h-96 overflow-y-auto border rounded-lg p-4 space-y-4">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    
                    {message.recommendations && (
                      <div className="mt-2 space-y-1">
                        <p className="text-sm font-medium">Recommendations:</p>
                        {message.recommendations.map((rec, idx) => (
                          <Badge key={idx} variant="secondary" className="mr-1">
                            {rec}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                      <span>{message.timestamp.toLocaleTimeString()}</span>
                      {message.audioUrl && (
                        <Button size="sm" variant="ghost">
                          <Volume2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Processing Status */}
            {isLoading && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="text-sm">{processingStatus || 'Processing...'}</span>
                </div>
                <Progress value={33} className="w-full" />
              </div>
            )}

            {/* File Upload Area */}
            {uploadedFiles.length > 0 && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="flex flex-wrap gap-2">
                  {uploadedFiles.map((file, idx) => (
                    <Badge key={idx} variant="outline" className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {file.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="flex gap-2">
              <div className="flex-1 space-y-2">
                <Textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Ask me anything in ${selectedLanguage}...`}
                  className="min-h-[60px]"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Upload
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startVoiceRecording}
                    disabled={isListening}
                  >
                    {isListening ? <MicOff className="w-4 h-4 mr-1" /> : <Mic className="w-4 h-4 mr-1" />}
                    {isListening ? 'Listening...' : 'Voice'}
                  </Button>
                </div>
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || (!inputText.trim() && uploadedFiles.length === 0)}
                className="self-end"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button
          variant="outline"
          className="h-20 flex flex-col items-center gap-2"
          onClick={() => setInputText("Help me prepare for ECZ Grade 12 Math exam")}
        >
          <BookOpen className="w-6 h-6" />
          ECZ Prep
        </Button>
        <Button
          variant="outline"
          className="h-20 flex flex-col items-center gap-2"
          onClick={() => setInputText("Explain this in simple terms")}
        >
          <Lightbulb className="w-6 h-6" />
          Simplify
        </Button>
        <Button
          variant="outline"
          className="h-20 flex flex-col items-center gap-2"
          onClick={() => setInputText("Create a study plan for me")}
        >
          <Target className="w-6 h-6" />
          Study Plan
        </Button>
        <Button
          variant="outline"
          className="h-20 flex flex-col items-center gap-2"
          onClick={() => setInputText("Practice questions for this topic")}
        >
          <Zap className="w-6 h-6" />
          Practice
        </Button>
      </div>
    </div>
  );
};

export default ComprehensiveAIAssistant;
