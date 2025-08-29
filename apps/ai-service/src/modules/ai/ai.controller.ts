import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { AIRequest, AIResponse } from '@service-ticket/types';

@ApiTags('AI Analysis')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('analyze')
  @ApiOperation({ summary: 'Analyze ticket content using AI' })
  @ApiResponse({ status: 200, description: 'Ticket analyzed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async analyzeTicket(@Body() request: AIRequest): Promise<AIResponse> {
    return this.aiService.analyzeTicket(request);
  }

  @Post('generate-response')
  @ApiOperation({ summary: 'Generate suggested response for ticket' })
  @ApiResponse({ status: 200, description: 'Response generated successfully' })
  async generateResponse(@Body() body: { content: string }): Promise<{ response: string }> {
    const response = await this.aiService.generateResponse(body.content);
    return { response };
  }
}
