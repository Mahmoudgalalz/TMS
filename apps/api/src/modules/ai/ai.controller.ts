import {
  Controller,
  Post,
  Body,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AiService, TicketAnalysisRequest } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import type { UserRole } from '../../database/schema';

@ApiTags('AI Analysis')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('analyze')
  @Roles(['associate', 'manager'])
  @ApiOperation({ summary: 'Analyze ticket content with AI' })
  @ApiBody({
    description: 'Ticket data for AI analysis',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Login issue with mobile app' },
        description: { type: 'string', example: 'Users cannot login after recent update' },
      },
      required: ['title', 'description'],
    },
  })
  @ApiResponse({ status: 200, description: 'AI analysis completed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async analyzeTicket(@Body(ValidationPipe) ticketData: TicketAnalysisRequest) {
    return this.aiService.analyzeTicket(ticketData);
  }

  @Post('predict-severity')
  @Roles(['associate', 'manager'])
  @ApiOperation({ summary: 'Predict ticket severity using AI' })
  @ApiBody({
    description: 'Ticket content for severity prediction',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Critical system outage' },
        description: { type: 'string', example: 'All users unable to access the system' },
      },
      required: ['title', 'description'],
    },
  })
  @ApiResponse({ status: 200, description: 'Severity prediction completed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async predictSeverity(
    @Body('title') title: string,
    @Body('description') description: string,
  ) {
    return this.aiService.predictSeverity(title, description);
  }

  @Post('categorize')
  @Roles(['associate', 'manager'])
  @ApiOperation({ summary: 'Categorize ticket using AI' })
  @ApiBody({
    description: 'Ticket content for categorization',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Password reset not working' },
        description: { type: 'string', example: 'Cannot reset password via email' },
      },
      required: ['title', 'description'],
    },
  })
  @ApiResponse({ status: 200, description: 'Categorization completed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async categorizeTicket(
    @Body('title') title: string,
    @Body('description') description: string,
  ) {
    return this.aiService.categorizeTicket(title, description);
  }

  @Post('sentiment')
  @Roles(['associate', 'manager'])
  @ApiOperation({ summary: 'Analyze sentiment of text' })
  @ApiBody({
    description: 'Text for sentiment analysis',
    schema: {
      type: 'object',
      properties: {
        text: { type: 'string', example: 'I am very frustrated with this issue' },
      },
      required: ['text'],
    },
  })
  @ApiResponse({ status: 200, description: 'Sentiment analysis completed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async analyzeSentiment(@Body('text') text: string) {
    return this.aiService.analyzeSentiment(text);
  }

  @Post('suggest-response')
  @Roles(['associate', 'manager'])
  @ApiOperation({ summary: 'Get AI-suggested response for ticket' })
  @ApiBody({
    description: 'Ticket data for response suggestion',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Unable to access dashboard' },
        description: { type: 'string', example: 'Getting 404 error when trying to access dashboard' },
      },
      required: ['title', 'description'],
    },
  })
  @ApiResponse({ status: 200, description: 'Response suggestion generated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async suggestResponse(@Body(ValidationPipe) ticketData: TicketAnalysisRequest) {
    return this.aiService.suggestResponse(ticketData);
  }
}
