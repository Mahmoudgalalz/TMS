import { Module } from '@nestjs/common';
import { CsvService } from './csv.service';
import { CsvController } from './csv.controller';
import { DatabaseModule } from '../../database/database.module';
import { QueueModule } from '../../queue/queue.module';

@Module({
  imports: [DatabaseModule, QueueModule],
  providers: [CsvService],
  controllers: [CsvController],
  exports: [CsvService],
})
export class CsvModule {}
