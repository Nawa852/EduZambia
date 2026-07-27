
import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Zap, Globe, Shield } from 'lucide-react';

const APIFlowchartVisualization = () => {
  const studyAssistantRef = useRef<HTMLDivElement>(null);
  const competitionRef = useRef<HTMLDivElement>(null);
  const examPrepRef = useRef<HTMLDivElement>(null);
  const accessibilityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      themeVariables: {
        primaryColor: '#198A00',
        primaryTextColor: '#000000',
        primaryBorderColor: '#FF7300',
        lineColor: '#CA0000',
        secondaryColor: '#FFFF00',
        tertiaryColor: '#ffffff'
      }
    });

    const renderFlowcharts = async () => {
      // AI Study Assistant Flowchart
      const studyAssistantChart = `
        graph TD
            A[User: Uploads PDF + Voice Query<br/>"Explain quadratic equations" Bemba] -->|React Frontend| B[Backend: Node.js]
            
            subgraph Online["Online Processing"]
                B -->|POST /ocr<br/>MINIMAX_API_KEY| C[MiniMax: Extract PDF Text]
                B -->|POST /transcribe<br/>GROCK_API_KEY| D[Grok Whisper: Transcribe Voice]
                D -->|Text Output| E[Qwen: Translate Bemba to English<br/>QWEN_API_KEY]
                C -->|PDF Text| F[GPT-4o: Generate ECZ Response<br/>OPENAI_API_KEY]
                E -->|Translated Query| F
                F -->|Response| G[Grok: Add Conversational Tone<br/>GROCK_API_KEY]
                G -->|Response| H[Kimi: Recommend Resources<br/>KIMI_AI_API_KEY]
                G -->|Response| I[Gemma: Summarize for Low-Resource<br/>GEMMA_API_KEY]
                I -->|Summarized Response| J[Qwen: Translate to Bemba<br/>QWEN_API_KEY]
                J -->|Translated Response| K[MiniMax: Verify Safety<br/>MINIMAX_API_KEY]
                K -->|Safe Response| L[Firebase: Cache Response]
                K -->|Safe Response| M[Frontend: Display Text + Audio]
            end

            subgraph Offline["Offline Fallback"]
                A -->|No Internet| N[LLaMA 4: Offline Q&A<br/>LLAMA4_API_KEY]
                N -->|Cached Response| L
            end

            L -->|Cached Data| M
            M -->|Text, Audio, Recommendations| O[User: Views Response]
      `;

      // Group Competition Arena Flowchart
      const competitionChart = `
        graph TD
            A[User: Joins Quiz Battle] --> B[Backend]
            B -->|POST /create_competition| C[DeepSeek: Generate Questions<br/>DEEPSEEK_API_KEY]
            B -->|POST /recommend| D[Kimi: Team Formation<br/>KIMI_AI_API_KEY]
            C -->|Questions| E[GPT-4o: Create Narrative<br/>OPENAI_API_KEY]
            D -->|Teams| F[Twilio: Video + SMS<br/>TWILIO_API_KEY]
            E -->|Narrative| G[MiniMax: Verify Answers<br/>MINIMAX_API_KEY]
            G -->|Safe Answers| H[Gemma: Summarize Results<br/>GEMMA_API_KEY]
            H -->|Results| I[Firebase: Update Leaderboard]
            I -->|Cached| J[Frontend: Display Competition]
            A -->|Offline| K[LLaMA 4: Cached Quiz<br/>LLAMA4_API_KEY]
            K -->|Cached Data| J
      `;

      // ECZ Exam Prep Flowchart
      const examPrepChart = `
        graph TD
            A[User: Starts Mock Exam] --> B[Backend]
            B -->|POST /generate_quiz| C[DeepSeek: Create Questions<br/>DEEPSEEK_API_KEY]
            C -->|Questions| D[Claude 3: Grade Essays<br/>CLAUDE_API_KEY]
            C -->|Questions| E[GPT-4o: Provide Explanations<br/>OPENAI_API_KEY]
            E -->|Feedback| F[Gemma: Summarize Results<br/>GEMMA_API_KEY]
            B -->|GET /videos| G[YouTube: Examiner Insights<br/>YOUTUBE_API_KEY]
            F -->|Results| H[Firebase: Track Analytics]
            H -->|Cached| I[Frontend: Display Results]
            A -->|Offline| J[LLaMA 3: Cached Exam<br/>LLAMA_API_KEY]
            J -->|Cached Data| I
      `;

      // Accessibility Portal Flowchart
      const accessibilityChart = `
        graph TD
            A[User: Accessibility Mode] --> B[Backend]
            B -->|POST /generate_avatar| C[Gemini 2.5: Sign Language<br/>GEMINI2_5_API_KEY]
            B -->|POST /translate| D[Qwen: Translate to Bemba<br/>QWEN_API_KEY]
            B -->|POST /text-to-speech| E[Grok: Narrate Lessons<br/>GROCK_API_KEY]
            E -->|Narration| F[Gemma: Create Lightweight Guide<br/>GEMMA_API_KEY]
            F -->|Content| G[Firebase: Cache Accessibility]
            G -->|Cached| H[Frontend: Display Accessible Content]
            A -->|Offline| I[LLaMA 4: Cached Content<br/>LLAMA4_API_KEY]
            I -->|Cached Data| H
      `;

      try {
        if (studyAssistantRef.current) {
          const { svg: studySvg } = await mermaid.render('study-assistant-chart', studyAssistantChart);
          studyAssistantRef.current.innerHTML = studySvg;
        }

        if (competitionRef.current) {
          const { svg: compSvg } = await mermaid.render('competition-chart', competitionChart);
          competitionRef.current.innerHTML = compSvg;
        }

        if (examPrepRef.current) {
          const { svg: examSvg } = await mermaid.render('exam-prep-chart', examPrepChart);
          examPrepRef.current.innerHTML = examSvg;
        }

        if (accessibilityRef.current) {
          const { svg: accessSvg } = await mermaid.render('accessibility-chart', accessibilityChart);
          accessibilityRef.current.innerHTML = accessSvg;
        }
      } catch (error) {
        console.error('Error rendering flowcharts:', error);
      }
    };

    renderFlowcharts();
  }, []);

  return (
    <div className="w-full w-full p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-orange-600 bg-clip-text text-transparent mb-4">
          Synapse API Integration Flowcharts
        </h1>
        <p className="text-xl text-gray-600 max-w-4xl mx-auto">
          Visualizing how our AI-powered APIs work together to deliver personalized, culturally relevant education for Zambian students
        </p>
      </div>

      <Tabs defaultValue="study-assistant" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="study-assistant" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            AI Study Assistant
          </TabsTrigger>
          <TabsTrigger value="competition" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Group Competition
          </TabsTrigger>
          <TabsTrigger value="exam-prep" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            ECZ Exam Prep
          </TabsTrigger>
          <TabsTrigger value="accessibility" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Accessibility Portal
          </TabsTrigger>
        </TabsList>

        <TabsContent value="study-assistant">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-6 h-6 text-blue-600" />
                AI Study Assistant API Flow
              </CardTitle>
              <p className="text-gray-600">
                Shows how a student uploads a PDF and asks "Explain quadratic equations" in Bemba via voice
              </p>
            </CardHeader>
            <CardContent>
              <div ref={studyAssistantRef} className="w-full overflow-x-auto" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competition">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-6 h-6 text-orange-600" />
                Group Competition Arena API Flow
              </CardTitle>
              <p className="text-gray-600">
                Demonstrates inter-school Grade 12 Math quiz battle with live video and SMS
              </p>
            </CardHeader>
            <CardContent>
              <div ref={competitionRef} className="w-full overflow-x-auto" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exam-prep">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-6 h-6 text-green-600" />
                ECZ Exam Prep Center API Flow
              </CardTitle>
              <p className="text-gray-600">
                Shows how Grade 12 students take mock Biology exams with AI grading
              </p>
            </CardHeader>
            <CardContent>
              <div ref={examPrepRef} className="w-full overflow-x-auto" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accessibility">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-purple-600" />
                Inclusive Education Portal API Flow
              </CardTitle>
              <p className="text-gray-600">
                Illustrates accessibility features for students with visual impairments
              </p>
            </CardHeader>
            <CardContent>
              <div ref={accessibilityRef} className="w-full overflow-x-auto" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-green-800">Core AI Processing</h3>
            <p className="text-sm text-green-600">GPT-4o, Grok, DeepSeek</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-orange-800">Accessibility</h3>
            <p className="text-sm text-orange-600">Gemini 2.5, Whisper</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-red-800">Safety & Privacy</h3>
            <p className="text-sm text-red-600">MiniMax, Claude 3</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-yellow-800">Recommendations</h3>
            <p className="text-sm text-yellow-600">Kimi, Moonshot AI</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default APIFlowchartVisualization;
