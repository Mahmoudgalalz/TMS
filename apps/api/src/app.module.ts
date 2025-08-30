import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { QueueModule } from './queue/queue.module';
import { HealthModule } from './health/health.module';
import { WebsocketModule } from './modules/websocket/websocket.module';
import { AiModule } from './modules/ai/ai.module';
import { AuthModule } from './modules/auth/auth.module';
import { CsvModule } from './modules/csv/csv.module';
import { TicketsModule } from './modules/tickets/tickets.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    QueueModule,
    AuthModule,
    TicketsModule,
    CsvModule,
    AiModule,
    WebsocketModule,
    HealthModule,
  ],
})
export class AppModule {}
