import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WEBSOCKET_CONFIG } from '@service-ticket/config';

@WebSocketGateway({
  cors: WEBSOCKET_CONFIG.cors,
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, Socket>();

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // Remove from connected users
    for (const [userId, socket] of this.connectedUsers.entries()) {
      if (socket.id === client.id) {
        this.connectedUsers.delete(userId);
        break;
      }
    }
  }

  @SubscribeMessage('join')
  handleJoin(@MessageBody() data: { userId: string }, @ConnectedSocket() client: Socket) {
    this.connectedUsers.set(data.userId, client);
    client.join(`user:${data.userId}`);
  }

  // Emit ticket updates to relevant users
  emitTicketUpdate(ticketId: string, data: any) {
    this.server.emit('ticket_updated', { ticketId, data });
  }

  // Emit notifications to specific users
  emitUserNotification(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification', notification);
  }

  // Emit comment added to ticket subscribers
  emitCommentAdded(ticketId: string, comment: any) {
    this.server.emit('comment_added', { ticketId, comment });
  }
}
