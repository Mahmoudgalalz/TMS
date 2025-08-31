import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { CreateTicketDto, UpdateTicketDto, TicketFilterDto } from './dto/ticket.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { UserRole } from '@service-ticket/types';

@ApiTags('Tickets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @Roles([UserRole.ASSOCIATE, UserRole.MANAGER])
  @ApiOperation({ summary: 'Create a new ticket' })
  @ApiResponse({ status: 201, description: 'Ticket successfully created' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body(ValidationPipe) createTicketDto: CreateTicketDto,
    @Request() req,
  ) {
    return this.ticketsService.create(createTicketDto, req.user.id);
  }

  @Get()
  @Roles([UserRole.ASSOCIATE, UserRole.MANAGER])
  @ApiOperation({ summary: 'Get all tickets with filtering and pagination' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'severity', required: false, description: 'Filter by severity' })
  @ApiQuery({ name: 'assignedToId', required: false, description: 'Filter by assigned user' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in title/description' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'Tickets retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Query(ValidationPipe) filters: TicketFilterDto) {
    return this.ticketsService.findAll(filters);
  }

  @Get(':id')
  @Roles([UserRole.ASSOCIATE, UserRole.MANAGER])
  @ApiOperation({ summary: 'Get ticket by ID' })
  @ApiParam({ name: 'id', description: 'Ticket UUID' })
  @ApiResponse({ status: 200, description: 'Ticket found' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @Patch(':id')
  @Roles([UserRole.ASSOCIATE, UserRole.MANAGER])
  @ApiOperation({ summary: 'Update ticket by ID' })
  @ApiParam({ name: 'id', description: 'Ticket UUID' })
  @ApiResponse({ status: 200, description: 'Ticket updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data or status transition' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateTicketDto: UpdateTicketDto,
    @Request() req,
  ) {
    return this.ticketsService.update(id, updateTicketDto, req.user.id, req.user.role);
  }

  @Delete(':id')
  @Roles([UserRole.MANAGER])
  @ApiOperation({ summary: 'Soft delete ticket by ID (Manager only)' })
  @ApiParam({ name: 'id', description: 'Ticket UUID' })
  @ApiResponse({ status: 200, description: 'Ticket deleted successfully' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Manager role required' })
  async remove(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req,
  ) {
    return this.ticketsService.remove(id, req.user.id, reason);
  }

  @Post(':id/approve')
  @Roles([UserRole.MANAGER])
  @ApiOperation({ summary: 'Approve ticket (Manager only)' })
  @ApiParam({ name: 'id', description: 'Ticket UUID' })
  @ApiResponse({ status: 200, description: 'Ticket approved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid ticket status for approval' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Manager role required' })
  async approve(
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.ticketsService.approveTicket(id, req.user.id);
  }

  @Get(':id/history')
  @Roles([UserRole.ASSOCIATE, UserRole.MANAGER])
  @ApiOperation({ summary: 'Get ticket history by ticket ID' })
  @ApiParam({ name: 'id', description: 'Ticket UUID' })
  @ApiResponse({ status: 200, description: 'Ticket history retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getHistory(@Param('id') id: string) {
    return this.ticketsService.getTicketHistory(id);
  }

  @Get('my/assigned')
  @Roles([UserRole.ASSOCIATE, UserRole.MANAGER])
  @ApiOperation({ summary: 'Get tickets assigned to current user' })
  @ApiResponse({ status: 200, description: 'Assigned tickets retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyAssignedTickets(
    @Request() req,
    @Query(ValidationPipe) filters: TicketFilterDto,
  ) {
    return this.ticketsService.findAll({
      ...filters,
      assignedToId: req.user.id,
    });
  }

  @Get('my/created')
  @Roles([UserRole.ASSOCIATE, UserRole.MANAGER])
  @ApiOperation({ summary: 'Get tickets created by current user' })
  @ApiResponse({ status: 200, description: 'Created tickets retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyCreatedTickets(
    @Request() req,
    @Query(ValidationPipe) filters: TicketFilterDto,
  ) {
    return this.ticketsService.findAll({
      ...filters,
      createdById: req.user.id,
    });
  }

  @Patch(':id/approve')
  @Roles([UserRole.MANAGER])
  @ApiOperation({ summary: 'Approve ticket without changes (Manager only)' })
  @ApiParam({ name: 'id', description: 'Ticket UUID' })
  @ApiResponse({ status: 200, description: 'Ticket approved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid ticket state or permissions' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Manager role required' })
  async approveTicket(
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.ticketsService.approveTicket(id, req.user.id);
  }
}
