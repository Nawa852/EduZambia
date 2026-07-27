
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, Send, Bot, User, BookOpen, Lightbulb, 
  Volume2, Languages, Brain, Sparkles 
} from "lucide-react";

const AITutor = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: "Hello! I'm your AI tutor for Learn Smart Zambia. I can help you with any subject. What would you like to learn today?",
      timestamp: "10:30 AM"
    },
    {
      id: 2,
      type: 'user',
      content: "Can you help me understand JavaScript functions?",
      timestamp: "10:31 AM"
    },
    {
      id: 3,
      type: 'ai',
      content: "Absolutely! JavaScript functions are reusable blocks of code. Think of them like instructions you can use over and over. Would you like me to show you some examples?",
      timestamp: "10:31 AM"
    }
  ]);
  
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const aiCapabilities = [
    { icon: Languages, title: "Multi-language Support", description: "English, Bemba, Nyanja" },
    { icon: Brain, title: "Adaptive Learning", description: "Adjusts to your pace" },
    { icon: Volume2, title: "Voice Interaction", description: "Speak or type questions" },
    { icon: Lightbulb, title: "Smart Explanations", description: "Contextual help & examples" }
  ];

  const quickActions = [
    "Explain this concept",
    "Generate practice quiz",
    "Summarize this lesson",
    "Help with homework",
    "Career guidance",
    "Study plan creation"
  ];

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    const newMessage = {
      id: messages.length + 1,
      type: 'user' as const,
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages([...messages, newMessage]);
    setInputMessage('');
    setIsTyping(true);
    
    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        type: 'ai' as const,
        content: "I understand your question. Let me provide a detailed explanation with examples to help you learn better...",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full">
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 flex items-center">
            <Bot className="mr-3 h-8 w-8 text-zambia-copper" />
            AI Learning Assistant
          </h1>
          <p className="text-gray-600">Your personal AI tutor available 24/7 in multiple languages</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* AI Capabilities */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Sparkles className="mr-2 h-5 w-5" />
                  AI Capabilities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {aiCapabilities.map((capability, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <capability.icon className="h-5 w-5 text-zambia-emerald mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">{capability.title}</div>
                      <div className="text-xs text-gray-600">{capability.description}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {quickActions.map((action, index) => (
                  <Button 
                    key={index}
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start text-left h-auto py-2"
                    onClick={() => setInputMessage(action)}
                  >
                    {action}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <MessageSquare className="mr-2 h-5 w-5" />
                  AI Chat Session
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Online
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              
              {/* Messages */}
              <div className="h-96 overflow-y-auto space-y-4 mb-4 p-4 bg-gray-50 rounded-lg">
                {messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start space-x-2 max-w-xs lg:max-w-md`}>
                      {message.type === 'ai' && (
                        <div className="w-8 h-8 bg-zambia-copper rounded-full flex items-center justify-center">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                      )}
                      
                      <div className={`px-4 py-2 rounded-lg ${
                        message.type === 'user' 
                          ? 'bg-zambia-emerald text-white' 
                          : 'bg-white border'
                      }`}>
                        <div className="text-sm">{message.content}</div>
                        <div className={`text-xs mt-1 ${
                          message.type === 'user' ? 'text-green-100' : 'text-gray-500'
                        }`}>
                          {message.timestamp}
                        </div>
                      </div>
                      
                      {message.type === 'user' && (
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex items-start space-x-2">
                      <div className="w-8 h-8 bg-zambia-copper rounded-full flex items-center justify-center">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <div className="px-4 py-2 rounded-lg bg-white border">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="flex space-x-2">
                <Input
                  placeholder="Ask me anything about your studies..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendMessage}
                  className="bg-zambia-copper hover:bg-orange-600"
                  disabled={!inputMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AITutor;
