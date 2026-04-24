import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway()
export class NotificationsGateway {
  @WebSocketServer()
  server!: Server;

  @SubscribeMessage('message')
  handleMessage(client: any, payload: any): string {
    return 'Hello world!';
  }

  sendNewInquiry(inquiry: unknown) {
    this.server?.emit('new-inquiry', inquiry);
  }

  sendNewAppointment(appointment: unknown) {
    this.server?.emit('new-appointment', appointment);
  }
}
