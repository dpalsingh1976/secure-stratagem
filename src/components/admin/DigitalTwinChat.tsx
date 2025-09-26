import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Send, Bot, User, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { DigitalTwinQuestion, DigitalTwinResponse, DbDigitalTwinConversation, mapDbToDigitalTwinQuestion } from '@/types/iul';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  response?: DigitalTwinResponse;
  timestamp: string;
}

export const DigitalTwinChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedIllustration, setSelectedIllustration] = useState('');
  const [illustrations, setIllustrations] = useState<any[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch available illustrations
  const fetchIllustrations = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('iul_illustrations')
      .select('id, file_name, carrier_name, processing_status')
      .eq('user_id', user.id)
      .eq('processing_status', 'completed')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching illustrations:', error);
      return;
    }

    setIllustrations(data || []);
  };

  // Fetch conversation history
  const fetchConversationHistory = async (illustrationId: string) => {
    if (!user || !illustrationId) return;

    const { data, error } = await supabase
      .from('digital_twin_conversations')
      .select('*')
      .eq('user_id', user.id)
      .eq('illustration_id', illustrationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching conversation:', error);
      return;
    }

    const conversationMessages: Message[] = data.map((conv: DbDigitalTwinConversation) => [
      {
        id: `${conv.id}-question`,
        type: 'user' as const,
        content: conv.question,
        timestamp: conv.created_at
      },
      {
        id: `${conv.id}-answer`,
        type: 'assistant' as const,
        content: (conv.response as DigitalTwinResponse)?.answer || 'Processing...',
        response: conv.response as DigitalTwinResponse,
        timestamp: conv.created_at
      }
    ]).flat();

    setMessages(conversationMessages);
  };

  // Send message to digital twin
  const sendMessage = async () => {
    if (!input.trim() || !selectedIllustration) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('digital-twin-query', {
        body: {
          illustrationId: selectedIllustration,
          question: input
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: `${Date.now()}-response`,
        type: 'assistant',
        content: data.response?.answer || 'I apologize, but I couldn\'t process that request.',
        response: data.response,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Show toast with key insights
      if (data.response?.recommendations?.length > 0) {
        toast({
          title: "Analysis Complete",
          description: `Generated ${data.response.recommendations.length} recommendations based on your question.`,
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to process your question. Please try again.",
        variant: "destructive",
      });

      const errorMessage: Message = {
        id: `${Date.now()}-error`,
        type: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Scroll to bottom when messages update
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Load illustrations on mount
  useEffect(() => {
    fetchIllustrations();
  }, [user]);

  // Load conversation when illustration changes
  useEffect(() => {
    if (selectedIllustration) {
      fetchConversationHistory(selectedIllustration);
    } else {
      setMessages([]);
    }
  }, [selectedIllustration]);

  // Sample questions
  const sampleQuestions = [
    "What if the premium is reduced by 20% starting in year 7?",
    "How does the cash value change if crediting drops to 4%?",
    "What happens if COI increases by 15% across all years?",
    "Show me the lapse risk if no premiums are paid after year 10",
    "Compare scenarios with 6% vs 8% crediting rates"
  ];

  const handleSampleQuestion = (question: string) => {
    setInput(question);
  };

  return (
    <div className="space-y-6">
      {/* Illustration Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Select Processed Illustration</label>
        <Select value={selectedIllustration} onValueChange={setSelectedIllustration}>
          <SelectTrigger>
            <SelectValue placeholder="Choose an illustration to analyze" />
          </SelectTrigger>
          <SelectContent>
            {illustrations.map((illustration) => (
              <SelectItem key={illustration.id} value={illustration.id}>
                <div className="flex items-center gap-2">
                  <span>{illustration.file_name}</span>
                  {illustration.carrier_name && (
                    <Badge variant="outline">{illustration.carrier_name}</Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedIllustration && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4" />
              <p>Select a processed illustration to start the digital twin simulation</p>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedIllustration && (
        <>
          {/* Sample Questions */}
          {messages.length === 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sample Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {sampleQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="justify-start text-left h-auto py-3"
                      onClick={() => handleSampleQuestion(question)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="whitespace-normal">{question}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Chat Messages */}
          <Card className="min-h-[400px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Digital Twin Conversation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[350px] pr-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-start gap-3 ${
                        message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.type === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-secondary text-secondary-foreground'
                      }`}>
                        {message.type === 'user' ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>
                      
                      <div className={`max-w-[80%] ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                        <div className={`rounded-lg px-4 py-2 ${
                          message.type === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}>
                          <p className="text-sm">{message.content}</p>
                        </div>
                        
                        {message.response && (
                          <div className="mt-3 space-y-3">
                            {/* Affected Metrics */}
                            {message.response.affectedMetrics && message.response.affectedMetrics.length > 0 && (
                              <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <TrendingUp className="h-4 w-4 text-blue-600" />
                                  <span className="text-sm font-medium">Affected Metrics</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {message.response.affectedMetrics.map((metric, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {metric}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Recommendations */}
                            {message.response.recommendations && message.response.recommendations.length > 0 && (
                              <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  <span className="text-sm font-medium">Recommendations</span>
                                </div>
                                <ul className="space-y-1 text-sm">
                                  {message.response.recommendations.map((rec, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                      <span className="text-green-600 mt-0.5">•</span>
                                      <span>{rec}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {loading && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                        <Bot className="h-4 w-4 animate-pulse" />
                      </div>
                      <div className="bg-muted rounded-lg px-4 py-2">
                        <p className="text-sm text-muted-foreground">Analyzing your question...</p>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Message Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Ask a 'what if' question about the policy..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !loading && sendMessage()}
              disabled={loading}
              className="flex-1"
            />
            <Button onClick={sendMessage} disabled={loading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
};