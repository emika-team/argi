import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MonitorsService } from './monitors.service';
import { CreateMonitorDto } from './dto/create-monitor.dto';
import { UpdateMonitorDto } from './dto/update-monitor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('monitors')
export class MonitorsController {
  constructor(private readonly monitorsService: MonitorsService) {}

  @Post('test/bulk-check')
  async testBulkCheck() {
    await this.monitorsService.scheduleBulkMonitorCheck();
    return { message: 'Bulk monitor check scheduled successfully' };
  }

  @Get('test/queue-info')
  async getQueueInfo() {
    return this.monitorsService.getQueueInfo();
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createMonitorDto: CreateMonitorDto, @Request() req) {
    return this.monitorsService.create(createMonitorDto, req.user._id);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Request() req) {
    return this.monitorsService.findAll(req.user._id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.monitorsService.findOne(id, req.user._id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/stats')
  getStats(@Param('id') id: string, @Request() req) {
    return this.monitorsService.getStats(id, req.user._id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('bulk-check')
  async triggerBulkCheck() {
    await this.monitorsService.scheduleBulkMonitorCheck();
    return { message: 'Bulk monitor check scheduled' };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateMonitorDto: UpdateMonitorDto,
    @Request() req,
  ) {
    return this.monitorsService.update(id, updateMonitorDto, req.user._id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.monitorsService.remove(id, req.user._id);
  }
} 