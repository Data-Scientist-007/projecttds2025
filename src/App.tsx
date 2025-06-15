import React, { useState } from 'react';
import { Brain, Database, MessageSquare, Github, ExternalLink, Upload, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface ApiResponse {
  answer: string;
  links: Array<{
    url: string;
    text: string;
  }>;
}

interface TestResult {
  question: string;
  response: ApiResponse | null;
  error: string | null;
  loading: boolean;
}

function App() {
  const [question, setQuestion] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [activeTab, setActiveTab] = useState<'test' | 'admin' | 'docs'>('test');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setTestResult({
      question,
      response: null,
      error: null,
      loading: true
    });

    try {
      let base64Image = '';
      if (image) {
        base64Image = await convertToBase64(image);
      }

      const response = await fetch('/api/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          ...(base64Image && { image: base64Image })
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTestResult(prev => prev ? { ...prev, response: data, loading: false } : null);
      } else {
        const errorData = await response.json();
        setTestResult(prev => prev ? { ...prev, error: errorData.error || 'Request failed', loading: false } : null);
      }
    } catch (error) {
      setTestResult(prev => prev ? { ...prev, error: error instanceof Error ? error.message : 'Unknown error', loading: false } : null);
    }
  };

  const sampleQuestions = [
    "Should I use gpt-4o-mini which AI proxy supports, or gpt3.5 turbo?",
    "How do I handle missing values in pandas DataFrames?",
    "What's the difference between supervised and unsupervised learning?",
    "How do I implement cross-validation in scikit-learn?",
    "What are the best practices for feature engineering?"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  TDS Virtual TA
                </h1>
                <p className="text-sm text-gray-600">AI-Powered Teaching Assistant</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="https://github.com/your-repo/tds-virtual-ta"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Github className="h-4 w-4" />
                <span>GitHub</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex space-x-1 bg-white/60 backdrop-blur-sm p-1 rounded-xl border border-gray-200/50">
          {([
            { id: 'test', label: 'API Test', icon: MessageSquare },
            { id: 'admin', label: 'Admin Panel', icon: Database },
            { id: 'docs', label: 'Documentation', icon: ExternalLink }
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all ${
                activeTab === id
                  ? 'bg-white shadow-sm text-blue-600 font-medium'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'test' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Question Form */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Test the API</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
                    Your Question
                  </label>
                  <textarea
                    id="question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask any question about the TDS course..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
                    Optional Image Attachment
                  </label>
                  <div className="relative">
                    <input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="flex items-center space-x-3 px-4 py-3 border border-gray-300 rounded-xl hover:border-gray-400 transition-colors cursor-pointer">
                      <Upload className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-600">
                        {image ? image.name : 'Choose an image file...'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!question.trim() || testResult?.loading}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {testResult?.loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                  <span>{testResult?.loading ? 'Processing...' : 'Send Question'}</span>
                </button>
              </form>

              {/* Sample Questions */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sample Questions</h3>
                <div className="space-y-2">
                  {sampleQuestions.map((sample, index) => (
                    <button
                      key={index}
                      onClick={() => setQuestion(sample)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Response Display */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">API Response</h2>
              
              {!testResult ? (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Send a question to see the API response</p>
                  </div>
                </div>
              ) : testResult.loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-blue-500" />
                    <p className="text-gray-600">Processing your question...</p>
                  </div>
                </div>
              ) : testResult.error ? (
                <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-red-900">Error</h3>
                    <p className="text-red-700 mt-1">{testResult.error}</p>
                  </div>
                </div>
              ) : testResult.response ? (
                <div className="space-y-6">
                  <div className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-medium text-green-900 mb-2">Answer</h3>
                      <p className="text-gray-700 leading-relaxed">{testResult.response.answer}</p>
                    </div>
                  </div>

                  {testResult.response.links && testResult.response.links.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-4">Relevant Links</h3>
                      <div className="space-y-3">
                        {testResult.response.links.map((link, index) => (
                          <a
                            key={index}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-4 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors group"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-blue-900 font-medium group-hover:text-blue-700">
                                  {link.text}
                                </p>
                                <p className="text-blue-600 text-sm mt-1 truncate">
                                  {link.url}
                                </p>
                              </div>
                              <ExternalLink className="h-4 w-4 text-blue-500 ml-2 mt-1" />
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Admin Panel</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white">
                <h3 className="text-lg font-semibold mb-2">Scraped Posts</h3>
                <p className="text-3xl font-bold">1,247</p>
                <p className="text-blue-100 text-sm">From Jan 1 - Apr 14, 2025</p>
              </div>
              <div className="p-6 bg-gradient-to-r from-green-500 to-green-600 rounded-xl text-white">
                <h3 className="text-lg font-semibold mb-2">Course Content</h3>
                <p className="text-3xl font-bold">156</p>
                <p className="text-green-100 text-sm">Pages indexed</p>
              </div>
              <div className="p-6 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl text-white">
                <h3 className="text-lg font-semibold mb-2">API Requests</h3>
                <p className="text-3xl font-bold">892</p>
                <p className="text-purple-100 text-sm">This month</p>
              </div>
            </div>
            <div className="mt-8">
              <button className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                Refresh Data
              </button>
            </div>
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-8 shadow-lg max-w-4xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">API Documentation</h2>
            
            <div className="prose prose-gray max-w-none">
              <h3>Endpoint</h3>
              <div className="bg-gray-100 rounded-lg p-4 font-mono text-sm">
                POST /api/
              </div>
              
              <h3>Request Format</h3>
              <div className="bg-gray-100 rounded-lg p-4 font-mono text-sm">
                {`{
  "question": "Your question here",
  "image": "base64_encoded_image_data (optional)"
}`}
              </div>
              
              <h3>Response Format</h3>
              <div className="bg-gray-100 rounded-lg p-4 font-mono text-sm">
                {`{
  "answer": "Generated answer based on course content",
  "links": [
    {
      "url": "https://discourse.onlinedegree.iitm.ac.in/...",
      "text": "Relevant discussion title"
    }
  ]
}`}
              </div>
              
              <h3>Example Usage</h3>
              <div className="bg-gray-100 rounded-lg p-4 font-mono text-sm">
                {`curl "https://your-app.com/api/" \\
  -H "Content-Type: application/json" \\
  -d '{"question": "How do I handle missing data?"}'`}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;