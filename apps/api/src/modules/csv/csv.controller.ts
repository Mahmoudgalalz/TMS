import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  Res,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { CsvService, CsvExportOptions } from './csv.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { UserRole, TicketStatus } from '../../database/schema';

@ApiTags('CSV Operations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('csv')
export class CsvController {
  constructor(private readonly csvService: CsvService) {}

  @Post('export')
  @Roles([UserRole.ASSOCIATE, UserRole.MANAGER])
  @ApiOperation({ summary: 'Export tickets to CSV file' })
  @ApiQuery({ name: 'status', required: false, enum: TicketStatus, description: 'Filter by status' })
  @ApiQuery({ name: 'includeResolved', required: false, type: Boolean, description: 'Include resolved tickets' })
  @ApiQuery({ name: 'dateFrom', required: false, type: String, description: 'Start date filter (ISO string)' })
  @ApiQuery({ name: 'dateTo', required: false, type: String, description: 'End date filter (ISO string)' })
  @ApiResponse({ status: 200, description: 'CSV export initiated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async exportTickets(
    @Query('status') status?: TicketStatus,
    @Query('includeResolved') includeResolved?: boolean,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const options: CsvExportOptions = {
      status,
      includeResolved: includeResolved === true,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    };

    const fileName = await this.csvService.exportTicketsToCsv(options);
    
    return {
      message: 'CSV export completed successfully',
      fileName,
      downloadUrl: `/csv/download/${fileName}`,
    };
  }

  @Get('download/:fileName')
  @Roles([UserRole.ASSOCIATE, UserRole.MANAGER])
  @ApiOperation({ summary: 'Download exported CSV file' })
  @ApiResponse({ status: 200, description: 'File downloaded successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async downloadCsv(
    @Query('fileName') fileName: string,
    @Res() res: Response,
  ) {
    try {
      const filePath = await this.csvService.getExportedFile(fileName);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      
      return res.sendFile(filePath);
    } catch (error) {
      throw new BadRequestException('File not found or access denied');
    }
  }

  @Post('import')
  @Roles([UserRole.MANAGER])
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `import-${uniqueSuffix}${path.extname(file.originalname)}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv')) {
        cb(new BadRequestException('Only CSV files are allowed'), false);
      } else {
        cb(null, true);
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
  }))
  @ApiOperation({ summary: 'Import tickets from CSV file (Manager only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'CSV file upload',
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'CSV import completed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or import errors' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Manager role required' })
  async importTickets(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const result = await this.csvService.importTicketsFromCsv(file.path, req.user.id);
      
      // Clean up uploaded file
      await this.csvService.deleteExportedFile(file.filename);
      
      return {
        message: 'CSV import completed',
        result: {
          totalProcessed: result.processed,
          successfulUpdates: result.updated,
          errors: result.errors.length,
          errorDetails: result.errors,
        },
      };
    } catch (error) {
      // Clean up uploaded file on error
      if (file.path) {
        await this.csvService.deleteExportedFile(file.filename);
      }
      throw new BadRequestException(`Import failed: ${error.message}`);
    }
  }

  @Post('schedule-automated-processing')
  @Roles([UserRole.MANAGER])
  @ApiOperation({ summary: 'Schedule automated CSV processing job (Manager only)' })
  @ApiResponse({ status: 200, description: 'Automated processing scheduled successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Manager role required' })
  async scheduleAutomatedProcessing() {
    await this.csvService.scheduleAutomatedCsvProcessing();
    
    return {
      message: 'Automated CSV processing scheduled successfully',
      scheduledAt: new Date().toISOString(),
    };
  }

  @Post('process-automated-updates')
  @Roles([UserRole.MANAGER])
  @ApiOperation({ summary: 'Manually trigger automated status updates (Manager only)' })
  @ApiResponse({ status: 200, description: 'Automated updates processed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Manager role required' })
  async processAutomatedUpdates() {
    await this.csvService.processAutomatedStatusUpdates();
    
    return {
      message: 'Automated status updates processed successfully',
      processedAt: new Date().toISOString(),
    };
  }
}
