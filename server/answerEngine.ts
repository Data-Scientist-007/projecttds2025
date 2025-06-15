import OpenAI from 'openai';
import { Database } from './database.js';

export interface ApiResponse {
  answer: string;
  links: Array<{
    url: string;
    text: string;
  }>;
}

export class AnswerEngine {
  private openai: OpenAI | null = null;
  private database: Database;

  constructor(database: Database) {
    this.database = database;
    
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  async generateAnswer(question: string, image?: string): Promise<ApiResponse> {
    try {
      // Search for relevant content
      const searchResults = await this.database.searchContent(question, 5);
      
      // If OpenAI is configured, use it to generate answer
      if (this.openai && searchResults.length > 0) {
        return await this.generateAIAnswer(question, searchResults, image);
      }
      
      // Fallback to rule-based answer generation
      return this.generateRuleBasedAnswer(question, searchResults);
    } catch (error) {
      console.error('Error generating answer:', error);
      throw error;
    }
  }

  private async generateAIAnswer(question: string, searchResults: any[], image?: string): Promise<ApiResponse> {
    try {
      const context = searchResults
        .map(result => `Title: ${result.title}\nContent: ${result.content}\nURL: ${result.url}`)
        .join('\n\n---\n\n');

      const messages: any[] = [
        {
          role: 'system',
          content: `You are a Teaching Assistant for the IIT Madras Tools in Data Science (TDS) course. 
          Answer student questions based on the provided course content and discourse discussions.
          Be concise, accurate, and helpful. If you're not sure about something, say so.
          Always provide relevant links when available.`
        },
        {
          role: 'user',
          content: `Question: ${question}\n\nRelevant Content:\n${context}`
        }
      ];

      // Add image if provided
      if (image) {
        messages[1].content = [
          { type: 'text', text: messages[1].content },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image}` } }
        ];
      }

      const completion = await this.openai!.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
        max_tokens: 500,
        temperature: 0.7,
      });

      const answer = completion.choices[0]?.message?.content || 'I apologize, but I cannot generate a response right now.';

      // Extract relevant links
      const links = searchResults
        .slice(0, 3)
        .map(result => ({
          url: result.url,
          text: result.title
        }));

      return { answer, links };
    } catch (error) {
      console.error('OpenAI API error:', error);
      // Fallback to rule-based answer
      return this.generateRuleBasedAnswer(question, searchResults);
    }
  }

  private generateRuleBasedAnswer(question: string, searchResults: any[]): ApiResponse {
    if (searchResults.length === 0) {
      return {
        answer: "I couldn't find specific information about your question in the course materials. Please try rephrasing your question or check the course documentation directly.",
        links: []
      };
    }

    // Generate a simple answer based on the first search result
    const topResult = searchResults[0];
    let answer = `Based on the course materials, here's what I found: ${topResult.content.substring(0, 300)}`;
    
    if (answer.length >= 300) {
      answer += "...";
    }

    // Add specific guidance for common question patterns
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('gpt') || lowerQuestion.includes('openai')) {
      answer += "\n\nFor GPT-related questions, make sure to use the exact model specified in the assignment instructions, even if other models are available through proxies.";
    }
    
    if (lowerQuestion.includes('pandas') || lowerQuestion.includes('dataframe')) {
      answer += "\n\nFor pandas-related questions, refer to the official documentation and the course examples provided in the lectures.";
    }

    const links = searchResults
      .slice(0, 3)
      .map(result => ({
        url: result.url,
        text: result.title
      }));

    return { answer, links };
  }
}