/* eslint-disable @typescript-eslint/no-explicit-any */
import * as signalR from '@microsoft/signalr';

type NotificationHandler = (data: any) => void;

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private handlers = new Set<NotificationHandler>();
  private isListenerRegistered = false;

  async start() {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    if (this.connection && !this.isListenerRegistered) {
      try {
        await this.connection.start();
        return;
      } catch {
        // Nếu reconnect fail, tạo connection mới
        this.connection = null;
        this.isListenerRegistered = false;
      }
    }
    if (!this.connection) {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl('http://172.16.162.103:5000/notificationHub', {
        accessTokenFactory: () => localStorage.getItem('token') || ''
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    if (!this.isListenerRegistered) {
        this.connection.on('ReceiveNotification', data => {
          this.handlers.forEach(h => h(data));
        });
        this.isListenerRegistered = true;
        console.log('[SignalR] Listener registered (one-time)');
    }
    this.connection.onclose(() => {
      console.log('[SignalR] Connection closed');
      this.isListenerRegistered = false;
      this.connection = null;
    });}

    await this.connection.start();
    console.log('SignalR connected', this.connection.connectionId);
  }

  onNotification(handler: NotificationHandler) {
    if (this.handlers.has(handler)) {
      return;
    }
    this.handlers.add(handler);
  }

  offNotification(handler: NotificationHandler) {
    this.handlers.delete(handler);
  }

  async stop() {
    await this.connection?.stop();
    this.connection = null;
  }
}

export const signalRService = new SignalRService();