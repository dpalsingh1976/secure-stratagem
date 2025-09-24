import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, X, Send, Bot, User, Calendar, Calculator, BookOpen, FileText, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  suggestions?: string[];
}

interface QuickAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  action: string;
}

const EnhancedChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi! I'm your AI financial risk advisor. I can help you understand complex financial concepts, assess risks, and plan your protection strategy. What would you like to explore today?",
      isBot: true,
      timestamp: new Date(),
      suggestions: [
        "What is the X-Curve in finance?",
        "Explain the Rule of 72",
        "What is a 7702 plan?",
        "How much life insurance do I need?",
        "What are the risks of early retirement?"
      ]
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const quickActions: QuickAction[] = [
    {
      icon: Calculator,
      label: "Life Insurance Calculator",
      description: "Calculate how much coverage you need",
      action: "How much life insurance coverage do I need based on my income and family situation?"
    },
    {
      icon: BookOpen,
      label: "Financial Concepts",
      description: "Learn about X-Curve, Rule of 72, etc.",
      action: "Can you explain the most important financial concepts I should understand?"
    },
    {
      icon: FileText,
      label: "Risk Assessment",
      description: "Understand your financial risks",
      action: "What are the main financial risks I should be concerned about and how can I protect myself?"
    },
    {
      icon: Calendar,
      label: "Retirement Planning",
      description: "Plan for your future",
      action: "Help me understand retirement planning and what I need to consider for my future financial security."
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const saveConversation = async (newMessages: Message[]) => {
    try {
      // Convert messages to JSON format for database storage
      const messagesJson = newMessages.map(msg => ({
        id: msg.id,
        text: msg.text,
        isBot: msg.isBot,
        timestamp: msg.timestamp.toISOString(),
        suggestions: msg.suggestions || []
      }));

      await supabase
        .from('chat_conversations')
        .upsert({
          session_id: sessionId,
          messages: messagesJson as any,
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  };

  const getResponse = async (userMessage: string): Promise<string> => {
    // Return a simple response since OpenAI functionality has been removed
    return "Thank you for your question. For detailed financial advice and personalized guidance, please contact our team to schedule a consultation with a licensed professional.";
  };

  const sendMessage = async (messageText?: string) => {
    const text = messageText || inputMessage.trim();
    if (!text) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      isBot: false,
      timestamp: new Date()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputMessage("");
    setIsTyping(true);

    try {
      const response = await getResponse(text);
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isBot: true,
        timestamp: new Date(),
        suggestions: generateSuggestions(response)
      };
      
      const finalMessages = [...newMessages, botResponse];
      setMessages(finalMessages);
      await saveConversation(finalMessages);
    } catch (error) {
      console.error('Error getting response:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const generateSuggestions = (response: string): string[] => {
    // Generate contextual suggestions based on the response
    const suggestions = [];
    
    if (response.toLowerCase().includes('insurance')) {
      suggestions.push("How do I compare insurance policies?");
      suggestions.push("What's the difference between term and whole life insurance?");
    }
    
    if (response.toLowerCase().includes('retirement')) {
      suggestions.push("When should I start retirement planning?");
      suggestions.push("What's a safe withdrawal rate in retirement?");
    }
    
    if (response.toLowerCase().includes('investment')) {
      suggestions.push("How should I diversify my portfolio?");
      suggestions.push("What's the difference between stocks and bonds?");
    }
    
    // Default suggestions if none are contextual
    if (suggestions.length === 0) {
      suggestions.push(
        "Tell me more about this topic",
        "What should I do next?",
        "Can you give me an example?"
      );
    }
    
    return suggestions.slice(0, 3);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const handleQuickAction = (action: QuickAction) => {
    sendMessage(action.action);
  };

  return (
    <>
      {/* Chat toggle button */}
      <Button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 btn-primary shadow-xl hover:shadow-2xl p-4 rounded-full transition-all duration-300 ${
          isOpen ? "scale-0" : "scale-100"
        }`}
      >
        <MessageCircle className="w-6 h-6" />
      </Button>

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-background border border-border rounded-xl shadow-2xl flex flex-col animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-primary rounded-t-xl text-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold">AI Financial Advisor</div>
                <div className="text-xs opacity-90">Powered by advanced AI</div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Quick Actions (shown when no messages or first message) */}
          {messages.length <= 1 && (
            <div className="p-4 border-b border-border">
              <h4 className="text-sm font-semibold mb-3 text-center">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction(action)}
                    className="h-auto p-2 flex flex-col items-center gap-1 text-xs"
                  >
                    <action.icon className="w-4 h-4" />
                    <span className="text-center">{action.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id}>
                <div className={`flex ${message.isBot ? "justify-start" : "justify-end"}`}>
                  <div className={`flex items-start gap-2 max-w-[85%] ${
                    message.isBot ? "flex-row" : "flex-row-reverse"
                  }`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      message.isBot 
                        ? "bg-primary text-white" 
                        : "bg-secondary text-white"
                    }`}>
                      {message.isBot ? (
                        <Bot className="w-3 h-3" />
                      ) : (
                        <User className="w-3 h-3" />
                      )}
                    </div>
                    <div className={`p-3 rounded-lg ${
                      message.isBot
                        ? "bg-muted text-foreground"
                        : "bg-primary text-white"
                    }`}>
                      <div className="text-sm leading-relaxed">{message.text}</div>
                      <div className={`text-xs mt-1 opacity-70 ${
                        message.isBot ? "text-muted-foreground" : "text-white/70"
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Suggestions */}
                {message.isBot && message.suggestions && (
                  <div className="mt-2 ml-8 space-y-1">
                    {message.suggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="text-xs h-6 px-2 mr-1 mb-1"
                      >
                        <Lightbulb className="w-3 h-3 mr-1" />
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-100"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-200"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about financial concepts, risks, planning..."
                className="flex-1 text-sm"
              />
              <Button
                onClick={() => sendMessage()}
                disabled={!inputMessage.trim() || isTyping}
                className="btn-primary px-3"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-xs text-muted-foreground mt-2 text-center">
              Press Enter to send • Personalized financial guidance
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EnhancedChatBot;