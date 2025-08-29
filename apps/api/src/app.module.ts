import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { TicketsModule } from './modules/tickets/tickets.module';
// import { CsvModule } from './modules/csv/csv.module';
import { AiModule } from './modules/ai/ai.module';
import { WebsocketModule } from './modules/websocket/websocket.module';
import { DatabaseModule } from './database/database.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    QueueModule,
    AuthModule,
    TicketsModule,
    // CsvModule,
    AiModule,
    WebsocketModule,
  ],
})
export class AppModule {}
