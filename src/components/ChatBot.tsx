import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi! I'm here to help answer your financial questions. Ask me about life insurance, retirement planning, or risk assessment.",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    // Life Insurance Keywords
    if (message.includes("life insurance") || message.includes("life coverage") || message.includes("death benefit")) {
      return "Life insurance provides financial protection for your family. Most experts recommend 10-12x your annual income in coverage. The younger you are when you apply, the lower your premiums will be for life. Would you like to start your risk assessment to see your specific coverage needs?";
    }
    
    if (message.includes("term") && message.includes("whole")) {
      return "Term life insurance is typically more affordable and covers you for a specific period (10-30 years). Whole life provides permanent coverage with a cash value component but costs more. For most families, term life insurance provides the most protection for the lowest cost.";
    }
    
    if (message.includes("cost") || message.includes("expensive") || message.includes("afford")) {
      return "Life insurance is more affordable than most people think! A healthy 30-year-old can get $500,000 in coverage for about $20-30/month. The key is applying while you're young and healthy. Every year you wait, premiums increase significantly.";
    }
    
    // Retirement Keywords
    if (message.includes("retirement") || message.includes("401k") || message.includes("ira")) {
      return "Retirement planning is crucial for long-term financial security. The general rule is to save 10-15% of your income for retirement. Starting early gives you the power of compound interest. Our assessment can show you if you're on track for your retirement goals.";
    }
    
    if (message.includes("enough") && (message.includes("retirement") || message.includes("save"))) {
      return "A common rule is the 4% withdrawal rule - you'll need 25x your desired annual retirement income saved. For example, if you want $50,000/year in retirement, you'd need $1.25 million saved. Our longevity risk analysis can show your specific needs.";
    }
    
    // Tax Keywords
    if (message.includes("tax") || message.includes("taxes")) {
      return "Tax diversification is often overlooked but crucial. Having money in traditional 401(k)s, Roth IRAs, and taxable accounts gives you flexibility in retirement. Our tax risk assessment evaluates your current tax diversification strategy.";
    }
    
    // Market/Investment Keywords
    if (message.includes("market") || message.includes("invest") || message.includes("stock")) {
      return "Market risk increases as you get closer to retirement. Younger investors can be more aggressive, while those nearing retirement should be more conservative. The key is having a diversified portfolio appropriate for your age and risk tolerance.";
    }
    
    // Assessment Keywords
    if (message.includes("assessment") || message.includes("analyze") || message.includes("risk")) {
      return "Our comprehensive risk assessment evaluates four key areas: Life Insurance Risk, Longevity Risk, Market Risk, and Tax Risk. It takes just 5 minutes and provides personalized recommendations. Would you like to start your free assessment now?";
    }
    
    // General Keywords
    if (message.includes("hello") || message.includes("hi") || message.includes("help")) {
      return "Hello! I'm here to help with your financial questions. I can explain life insurance, retirement planning, tax strategies, and more. What would you like to know about?";
    }
    
    if (message.includes("thank")) {
      return "You're welcome! Remember, the best time to start protecting your family's financial future is today. Feel free to ask more questions or start your risk assessment when you're ready.";
    }
    
    // Default responses
    const defaultResponses = [
      "That's a great question! Financial planning can be complex, but taking action is what matters most. Our risk assessment can provide personalized insights for your specific situation.",
      "I'd be happy to help you with that! For detailed analysis specific to your situation, I recommend starting our free 5-minute risk assessment.",
      "Financial security is a journey, not a destination. Let me help you understand your risks and opportunities. Would you like to start with our comprehensive assessment?"
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Simulate bot thinking time
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(inputMessage),
        isBot: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000); // Random delay between 1-2 seconds
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
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
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[500px] bg-background border border-border rounded-xl shadow-2xl flex flex-col animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-primary rounded-t-xl text-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold">Financial Assistant</div>
                <div className="text-xs opacity-90">Always here to help</div>
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

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isBot ? "justify-start" : "justify-end"}`}
              >
                <div className={`flex items-start gap-2 max-w-[80%] ${
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
                placeholder="Ask about life insurance, retirement, etc..."
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className="btn-primary px-3"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-xs text-muted-foreground mt-2 text-center">
              Press Enter to send • Get personalized advice
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;