import { IsString, IsOptional, IsEnum, IsUUID, IsDateString, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketStatus, TicketSeverity } from '@service-ticket/types';
import { Type } from 'class-transformer';

export class CreateTicketDto {
  @ApiProperty({ description: 'Ticket title', example: 'Login issue with mobile app' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Detailed ticket description', example: 'Users are unable to login using mobile app after recent update' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ enum: TicketSeverity, description: 'Ticket severity level' })
  @IsOptional()
  @IsEnum(TicketSeverity)
  severity?: TicketSeverity;

  @ApiPropertyOptional({ description: 'User ID to assign ticket to' })
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiPropertyOptional({ description: 'Due date for ticket resolution' })
  @IsOptional()
  @IsDateString()
  dueDate?: Date;
}

export class UpdateTicketDto {
  @ApiPropertyOptional({ description: 'Ticket title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Ticket description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: TicketSeverity, description: 'Ticket severity level' })
  @IsOptional()
  @IsEnum(TicketSeverity)
  severity?: TicketSeverity;

  @ApiPropertyOptional({ enum: TicketStatus, description: 'Ticket status' })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiPropertyOptional({ description: 'User ID to assign ticket to' })
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiPropertyOptional({ description: 'Due date for ticket resolution' })
  @IsOptional()
  @IsDateString()
  dueDate?: Date;

  @ApiPropertyOptional({ description: 'Reason for the update' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class TicketFilterDto {
  @ApiPropertyOptional({ enum: TicketStatus, description: 'Filter by ticket status' })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiPropertyOptional({ enum: TicketSeverity, description: 'Filter by ticket severity' })
  @IsOptional()
  @IsEnum(TicketSeverity)
  severity?: TicketSeverity;

  @ApiPropertyOptional({ description: 'Filter by assigned user ID' })
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiPropertyOptional({ description: 'Filter by creator user ID' })
  @IsOptional()
  @IsUUID()
  createdById?: string;

  @ApiPropertyOptional({ description: 'Search in ticket title and description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Sort field', enum: ['createdAt', 'updatedAt', 'dueDate', 'severity', 'status'] })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: 'Page number', minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', minimum: 1, maximum: 100, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
