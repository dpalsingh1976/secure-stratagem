import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MessageSquare, FileText, Upload, Lightbulb, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const COMMON_QUESTIONS = [
  {
    category: 'Life Insurance',
    questions: [
      'What are the key differences between term and permanent life insurance?',
      'How do IUL policies work and what are the risks?',
      'What riders should I consider for my life insurance policy?',
      'How is the death benefit calculated for variable universal life?'
    ]
  },
  {
    category: 'Annuities',
    questions: [
      'What are the surrender charges and when do they apply?',
      'How do index annuities track market performance?',
      'What are the income options available at annuitization?',
      'What happens to my annuity if the insurance company fails?'
    ]
  },
  {
    category: 'Policy Management',
    questions: [
      'How often should I review my life insurance policy?',
      'What triggers a reportable event for my policy?',
      'How do I change beneficiaries on my policy?',
      'What are my options if I can no longer afford premiums?'
    ]
  }
];

export default function PolicyAssistant() {
  const { user, hasRole } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [question, setQuestion] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversation, setConversation] = useState<Array<{
    type: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>>([]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleQuestionSubmit = async () => {
    if (!question.trim()) return;

    setIsProcessing(true);
    
    // Add user question to conversation
    const userMessage = {
      type: 'user' as const,
      content: question,
      timestamp: new Date()
    };
    
    setConversation(prev => [...prev, userMessage]);

    // Simulate AI processing (in real app, this would call an AI service)
    setTimeout(() => {
      const assistantMessage = {
        type: 'assistant' as const,
        content: `I understand you're asking about: "${question}". 

Based on common policy documentation and industry practices, here are some key points to consider:

• Life insurance policies typically have a contestability period of 2 years
• Premium payments should be made consistently to avoid policy lapse
• Policy loans may affect the death benefit and cash value growth
• Regular policy reviews help ensure coverage meets changing needs

${selectedFile ? `I've also analyzed your uploaded document "${selectedFile.name}" and found relevant sections that may apply to your question.` : ''}

Would you like me to elaborate on any specific aspect of this topic?`,
        timestamp: new Date()
      };
      
      setConversation(prev => [...prev, assistantMessage]);
      setQuestion('');
      setIsProcessing(false);
    }, 2000);
  };

  const handlePresetQuestion = (presetQuestion: string) => {
    setQuestion(presetQuestion);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/'}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Smart Policy Assistant</h1>
              <p className="text-gray-600">AI-powered help for insurance and annuity policy questions</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <span>Policy Q&A Chat</span>
                </CardTitle>
                <CardDescription>
                  Ask questions about your insurance policies, annuities, or general coverage topics
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col">
                {/* Conversation Area */}
                <div className="flex-1 overflow-y-auto bg-gray-50 rounded-lg p-4 mb-4 space-y-4">
                  {conversation.length === 0 ? (
                    <div className="text-center text-gray-500 mt-8">
                      <Lightbulb className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>Start by asking a question about your policy or uploading a document for analysis.</p>
                    </div>
                  ) : (
                    conversation.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            message.type === 'user'
                              ? 'bg-primary text-white'
                              : 'bg-white border border-gray-200'
                          }`}
                        >
                          <div className="whitespace-pre-wrap">{message.content}</div>
                          <div className={`text-xs mt-1 ${
                            message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {formatTime(message.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  
                  {isProcessing && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-200 p-3 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="animate-pulse flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                          <span className="text-gray-500 text-sm">Analyzing your question...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="space-y-3">
                  {/* File Upload */}
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <Label htmlFor="file-upload" className="cursor-pointer">
                        <div className="flex items-center space-x-2 p-2 border border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors">
                          <Upload className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {selectedFile ? selectedFile.name : 'Upload policy document (PDF, DOC)'}
                          </span>
                        </div>
                      </Label>
                      <Input
                        id="file-upload"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                    {selectedFile && (
                      <Badge variant="outline">
                        <FileText className="h-3 w-3 mr-1" />
                        Uploaded
                      </Badge>
                    )}
                  </div>

                  {/* Question Input */}
                  <div className="flex space-x-2">
                    <Textarea
                      placeholder="Ask your policy question here..."
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleQuestionSubmit();
                        }
                      }}
                      className="flex-1"
                      rows={2}
                    />
                    <Button 
                      onClick={handleQuestionSubmit} 
                      disabled={!question.trim() || isProcessing}
                      className="h-full"
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Ask
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar with Common Questions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Common Questions</CardTitle>
                <CardDescription>
                  Click any question to get started
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {COMMON_QUESTIONS.map((category, categoryIndex) => (
                    <div key={categoryIndex}>
                      <h4 className="font-semibold text-gray-900 mb-2">{category.category}</h4>
                      <div className="space-y-2">
                        {category.questions.map((q, questionIndex) => (
                          <button
                            key={questionIndex}
                            onClick={() => handlePresetQuestion(q)}
                            className="text-left text-sm text-gray-600 hover:text-primary hover:bg-primary/5 p-2 rounded transition-colors w-full"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Professional Disclaimer */}
            {hasRole('advisor') && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Professional Use</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-gray-600 space-y-2">
                    <p>
                      This AI assistant provides general guidance based on common policy features. 
                      Always refer to specific policy contracts for definitive terms.
                    </p>
                    <p>
                      For client consultations, verify all information with carrier documentation 
                      and consider individual circumstances.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}