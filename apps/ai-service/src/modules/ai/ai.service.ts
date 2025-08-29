import { Injectable, Logger } from '@nestjs/common';
import { AIRequest, AIResponse, AIAnalysis, TicketPriority } from '@service-ticket/types';
import { AI_CONFIG } from '@service-ticket/config';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  async analyzeTicket(request: AIRequest): Promise<AIResponse> {
    try {
      this.logger.log(`Analyzing ticket: ${request.ticketId}`);

      // Mock AI analysis - In production, this would integrate with Cloudflare Workers AI
      const analysis: AIAnalysis = {
        ticketId: request.ticketId,
        sentiment: this.analyzeSentiment(request.content),
        urgencyScore: this.calculateUrgencyScore(request.content),
        suggestedCategory: this.suggestCategory(request.content),
        suggestedPriority: this.suggestPriority(request.content),
        keyTopics: this.extractKeyTopics(request.content),
        suggestedResponse: this.generateSuggestedResponse(request.content),
        confidence: 0.85,
        processedAt: new Date(),
      };

      return {
        success: true,
        data: analysis,
      };
    } catch (error) {
      this.logger.error(`Failed to analyze ticket: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async generateResponse(ticketContent: string): Promise<string> {
    try {
      // Mock response generation - In production, integrate with Cloudflare Workers AI
      const responses = [
        "Thank you for contacting us. We've received your request and will get back to you within 24 hours.",
        "We understand your concern and are working on a solution. We'll update you shortly.",
        "Your issue has been escalated to our technical team. We'll provide an update within 2 business hours.",
        "We apologize for the inconvenience. Our team is investigating this issue and will resolve it promptly.",
      ];

      return responses[Math.floor(Math.random() * responses.length)];
    } catch (error) {
      this.logger.error(`Failed to generate response: ${error.message}`);
      throw error;
    }
  }

  private analyzeSentiment(content: string): 'positive' | 'neutral' | 'negative' {
    const negativeWords = ['angry', 'frustrated', 'terrible', 'awful', 'hate', 'worst', 'broken'];
    const positiveWords = ['great', 'excellent', 'love', 'amazing', 'perfect', 'wonderful'];
    
    const lowerContent = content.toLowerCase();
    const negativeCount = negativeWords.filter(word => lowerContent.includes(word)).length;
    const positiveCount = positiveWords.filter(word => lowerContent.includes(word)).length;

    if (negativeCount > positiveCount) return 'negative';
    if (positiveCount > negativeCount) return 'positive';
    return 'neutral';
  }

  private calculateUrgencyScore(content: string): number {
    const urgentWords = ['urgent', 'emergency', 'critical', 'asap', 'immediately', 'broken', 'down'];
    const lowerContent = content.toLowerCase();
    const urgentWordCount = urgentWords.filter(word => lowerContent.includes(word)).length;
    
    return Math.min(urgentWordCount * 0.2 + 0.3, 1.0);
  }

  private suggestCategory(content: string): string {
    const categories = {
      'technical': ['error', 'bug', 'crash', 'broken', 'not working', 'technical'],
      'billing': ['payment', 'invoice', 'charge', 'billing', 'refund', 'subscription'],
      'account': ['login', 'password', 'account', 'access', 'profile', 'settings'],
      'feature': ['feature', 'enhancement', 'improvement', 'suggestion', 'request'],
      'general': ['question', 'help', 'support', 'information', 'how to'],
    };

    const lowerContent = content.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        return category;
      }
    }

    return 'general';
  }

  private suggestPriority(content: string): TicketPriority {
    const urgencyScore = this.calculateUrgencyScore(content);
    const sentiment = this.analyzeSentiment(content);

    if (urgencyScore > 0.7 || sentiment === 'negative') {
      return TicketPriority.HIGH;
    } else if (urgencyScore > 0.4) {
      return TicketPriority.MEDIUM;
    } else {
      return TicketPriority.LOW;
    }
  }

  private extractKeyTopics(content: string): string[] {
    // Simple keyword extraction - In production, use more sophisticated NLP
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'cannot', 'cant', 'wont', 'dont', 'doesnt', 'didnt', 'isnt', 'arent', 'wasnt', 'werent', 'havent', 'hasnt', 'hadnt', 'a', 'an', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their'];
    
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.includes(word));

    const wordCount = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  private generateSuggestedResponse(content: string): string {
    const category = this.suggestCategory(content);
    const sentiment = this.analyzeSentiment(content);

    const responses = {
      technical: {
        positive: "Thank you for reporting this technical issue. Our development team will investigate and provide a solution.",
        neutral: "We've received your technical report. Our team will review the issue and get back to you with a resolution.",
        negative: "We sincerely apologize for the technical difficulties you're experiencing. Our team is prioritizing this issue and will resolve it as quickly as possible."
      },
      billing: {
        positive: "Thank you for your billing inquiry. We'll review your account and provide the information you need.",
        neutral: "We've received your billing question. Our accounts team will review and respond within 24 hours.",
        negative: "We apologize for any billing concerns. Our accounts team will immediately review your case and resolve any issues."
      },
      account: {
        positive: "Thank you for contacting us about your account. We'll assist you with your request promptly.",
        neutral: "We've received your account-related inquiry. Our support team will help you resolve this matter.",
        negative: "We're sorry you're having account access issues. Our team will prioritize resolving this for you immediately."
      },
      general: {
        positive: "Thank you for reaching out. We're happy to help with your inquiry.",
        neutral: "We've received your message and will respond with the information you need.",
        negative: "We apologize for any inconvenience. Our team will address your concerns promptly."
      }
    };

    return responses[category]?.[sentiment] || responses.general.neutral;
  }
}
