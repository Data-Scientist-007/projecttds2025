import axios from 'axios';
import * as cheerio from 'cheerio';
import { Database } from './database.js';
import dotenv from 'dotenv';

dotenv.config();

export class TDSScraper {
  private database: Database;
  private baseUrl = 'https://discourse.onlinedegree.iitm.ac.in';

  constructor(database: Database) {
    this.database = database;
  }

  async scrapeDiscourseCategory(categoryId: string, startDate: string, endDate: string): Promise<void> {
    try {
      console.log(`Scraping category ${categoryId} from ${startDate} to ${endDate}`);
      
      // This is a simplified scraper - in production, you'd need to handle:
      // - Authentication if required
      // - Pagination
      // - Rate limiting
      // - Error handling and retries
      
      const categoryUrl = `${this.baseUrl}/c/${categoryId}.json`;
      const response = await axios.get(categoryUrl, {
        headers: {
          'User-Agent': 'TDS-Virtual-TA-Scraper/1.0'
        }
      });

      if (response.data && response.data.topic_list && response.data.topic_list.topics) {
        const topics = response.data.topic_list.topics;
        
        for (const topic of topics) {
          try {
            await this.scrapeTopicDetails(topic.id, topic);
            
            // Add delay to be respectful to the server
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            console.error(`Error scraping topic ${topic.id}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error scraping discourse category:', error);
    }
  }

  async scrapeTopicDetails(topicId: number, topicMeta: any): Promise<void> {
    try {
      const topicUrl = `${this.baseUrl}/t/${topicId}.json`;
      const response = await axios.get(topicUrl, {
        headers: {
          'User-Agent': 'TDS-Virtual-TA-Scraper/1.0'
        }
      });

      if (response.data) {
        const topic = response.data;
        const posts = topic.post_stream?.posts || [];
        
        for (const post of posts) {
          const postData = {
            title: topic.title,
            content: this.cleanContent(post.cooked || post.raw || ''),
            url: `${this.baseUrl}/t/${topic.slug}/${topic.id}/${post.post_number}`,
            author: post.username || 'Unknown',
            category: topicMeta.category_id?.toString() || 'general',
            created_at: post.created_at
          };

          await this.database.insertDiscoursePost(postData);
        }
      }
    } catch (error) {
      console.error(`Error scraping topic details for ${topicId}:`, error);
    }
  }

  async scrapeCourseContent(courseUrl: string): Promise<void> {
    try {
      console.log(`Scraping course content from ${courseUrl}`);
      
      const response = await axios.get(courseUrl, {
        headers: {
          'User-Agent': 'TDS-Virtual-TA-Scraper/1.0'
        }
      });

      const $ = cheerio.load(response.data);
      
      // This is a generic scraper - you'd need to adapt it to the specific
      // structure of the course content pages
      
      const articles = $('article, .content, .lesson, .chapter');
      
      for (let i = 0; i < articles.length; i++) {
        const article = articles.eq(i);
        const title = article.find('h1, h2, .title').first().text().trim();
        const content = article.text().trim();
        
        if (title && content && content.length > 100) {
          const contentData = {
            title,
            content: this.cleanContent(content),
            url: courseUrl,
            type: 'lesson'
          };

          await this.database.insertCourseContent(contentData);
        }
      }
    } catch (error) {
      console.error('Error scraping course content:', error);
    }
  }

  private cleanContent(content: string): string {
    // Remove HTML tags and clean up the content
    const $ = cheerio.load(content);
    return $.text()
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();
  }

  async runFullScrape(): Promise<void> {
    try {
      console.log('Starting full scrape...');
      
      // Sample data for demonstration
      await this.insertSampleData();
      
      console.log('Scraping completed successfully');
    } catch (error) {
      console.error('Error during full scrape:', error);
    }
  }

  private async insertSampleData(): Promise<void> {
    // Insert some sample course content
    const sampleCourseContent = [
      {
        title: "Introduction to Python for Data Science",
        content: "Python is a versatile programming language that's particularly well-suited for data science. In this lesson, we'll cover the basics of Python syntax, data types, and control structures. We'll also introduce key libraries like NumPy, Pandas, and Matplotlib that are essential for data analysis and visualization.",
        url: "https://course.example.com/python-intro",
        type: "lesson"
      },
      {
        title: "Working with Pandas DataFrames",
        content: "Pandas is a powerful library for data manipulation and analysis. DataFrames are the primary data structure in Pandas, allowing you to work with structured data efficiently. Learn how to create, manipulate, and analyze data using DataFrame operations, including filtering, grouping, and aggregation.",
        url: "https://course.example.com/pandas-dataframes",
        type: "lesson"
      },
      {
        title: "Data Visualization with Matplotlib and Seaborn",
        content: "Effective data visualization is crucial for understanding and communicating insights from data. This lesson covers creating various types of plots using Matplotlib and Seaborn, including line plots, bar charts, histograms, and scatter plots. We'll also discuss best practices for creating clear and informative visualizations.",
        url: "https://course.example.com/data-visualization",
        type: "lesson"
      }
    ];

    for (const content of sampleCourseContent) {
      await this.database.insertCourseContent(content);
    }

    // Insert some sample discourse posts
    const sampleDiscourse = [
      {
        title: "GPT Model Selection for Assignment",
        content: "When working with GPT models for assignments, it's important to use the exact model specified in the instructions. Even if AI proxies support newer models like gpt-4o-mini, you should use gpt-3.5-turbo-0125 if that's what's specified in the assignment. This ensures consistency and fairness in grading.",
        url: "https://discourse.onlinedegree.iitm.ac.in/t/gpt-model-selection/12345",
        author: "teaching_assistant",
        category: "assignments",
        created_at: "2025-03-15T10:30:00Z"
      },
      {
        title: "Handling Missing Values in Pandas",
        content: "There are several ways to handle missing values in Pandas DataFrames. You can use dropna() to remove rows with missing values, fillna() to fill missing values with a specific value or method, or isnull() to identify missing values. The best approach depends on your specific use case and the nature of your data.",
        url: "https://discourse.onlinedegree.iitm.ac.in/t/missing-values-pandas/12346",
        author: "student_helper",
        category: "data-science",
        created_at: "2025-03-10T14:45:00Z"
      },
      {
        title: "Cross-validation Best Practices",
        content: "Cross-validation is essential for evaluating machine learning models. Use stratified k-fold for classification problems to maintain class distribution, and time series split for temporal data. Always ensure that data preprocessing steps are applied within each fold to prevent data leakage. scikit-learn provides excellent tools for cross-validation.",
        url: "https://discourse.onlinedegree.iitm.ac.in/t/cross-validation-practices/12347",
        author: "course_instructor",
        category: "machine-learning",
        created_at: "2025-03-08T09:15:00Z"
      }
    ];

    for (const post of sampleDiscourse) {
      await this.database.insertDiscoursePost(post);
    }
  }
}

// CLI script to run scraping
async function main() {
  const database = new Database();
  await database.initialize();
  
  const scraper = new TDSScraper(database);
  await scraper.runFullScrape();
  
  await database.close();
  console.log('Scraping completed!');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default TDSScraper;