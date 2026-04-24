import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class NotificationsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  handleConnection(client: any) {
    console.log('Client connected:', client.id);
  }

  sendNewInquiry(inquiry: any) {
    this.server.emit('new-inquiry', inquiry);
  }

  sendNewAppointment(appointment: any) {
    this.server.emit('new-appointment', appointment);
  }
}