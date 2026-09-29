import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

/**
 * Real-time WebSocket gateway.
 * Rooms:
 *   dispatcher:<depot>   — dispatchers see all events for their depot
 *   trip:<tripId>        — ops tracking specific trip
 *   store:<outletId>     — store manager sees their ETA
 *   driver:<userId>      — driver receives their assigned trip
 *   loader:<depot>       — loader sees bay queue updates
 */
@WebSocketGateway({ cors: { origin: '*' }, path: '/ws/socket.io' })
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const { room } = client.handshake.query;
    if (room) client.join(room as string);
    console.log(`WS client connected: ${client.id} → room: ${room}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`WS client disconnected: ${client.id}`);
  }

  /** Emit to all subscribers of a room */
  emit(room: string, event: string, payload: any) {
    this.server.to(room).emit(event, payload);
  }

  /** Dispatcher-wide alert */
  dispatcherAlert(depot: string, type: string, payload: any) {
    this.emit(`dispatcher:${depot}`, type, payload);
  }

  /** ETA update to store + ops */
  etaUpdate(tripId: string, outletId: string, payload: any) {
    this.emit(`trip:${tripId}`, 'eta_update', payload);
    this.emit(`store:${outletId}`, 'eta_update', payload);
  }

  /** Blackout signal lost/back to dispatcher */
  blackout(depot: string, payload: any) {
    this.dispatcherAlert(depot, 'signal_lost', payload);
  }

  blackoutResolved(depot: string, payload: any) {
    this.dispatcherAlert(depot, 'signal_back', payload);
  }

  /** Credit note issued — notify store manager */
  creditNoteIssued(outletId: string, creditNoteId: string, payload: any) {
    this.emit(`store:${outletId}`, 'credit_note_issued', { creditNoteId, ...payload });
  }
}
