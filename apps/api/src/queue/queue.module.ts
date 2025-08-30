import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { TicketProcessor } from './processors/ticket.processor';
import { CsvProcessor } from './processors/csv.processor';
import { QueueService } from './queue.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,
    BullModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST') || 'localhost',
          port: configService.get('REDIS_PORT') || 6379,
          password: configService.get('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      {
        name: 'ticket-processing',
      },
      {
        name: 'csv-processing',
      },
    ),
  ],
  providers: [TicketProcessor, CsvProcessor, QueueService],
  exports: [QueueService, HttpModule],
})
export class QueueModule {}
