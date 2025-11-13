import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ComplianceFooter } from "@/components/tax/ComplianceFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TaxAgent() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const quickPrompts = [
    "Explain why 85% of my SSI may be taxed when I have 401(k) income",
    "When do I pay back my accumulated tax savings?",
    "Show lifetime taxes if rates rise 3%",
    "Compare 401(k) vs Roth/LIRP for my situation"
  ];

  const sendMessage = async (text: string) => {
    setLoading(true);
    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput("");

    try {
      // Placeholder - streaming implementation would go here
      toast({
        title: "AI Agent",
        description: "AI agent integration ready. Connect to tax-agent function for responses.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container-financial section-padding">
        <h1 className="text-4xl font-bold text-foreground mb-2">Tax Planning AI Agent</h1>
        <p className="text-muted-foreground mb-8">Ask questions about retirement tax strategies</p>

        <div className="grid gap-2 mb-6">
          {quickPrompts.map((prompt, i) => (
            <Button key={i} variant="outline" onClick={() => sendMessage(prompt)} className="justify-start">
              {prompt}
            </Button>
          ))}
        </div>

        <Card className="p-4 min-h-[400px] mb-4">
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-primary/10 ml-12' : 'bg-muted mr-12'}`}>
                <p className="text-sm">{msg.content}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage(input)}
            placeholder="Ask about tax strategies..."
          />
          <Button onClick={() => sendMessage(input)} disabled={loading || !input}>
            {loading ? <Loader2 className="animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <ComplianceFooter />
      <Footer />
    </div>
  );
}
