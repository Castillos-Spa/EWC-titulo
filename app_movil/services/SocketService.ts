import { io, Socket } from 'socket.io-client';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export type NotificationWire = {
  id?: number | string;
  type?: string;
  message?: string;
  createdAt?: string | Date;
  read?: boolean;
};

export type NotificationInitPayload =
  | NotificationWire[]
  | {
      items?: NotificationWire[];
      data?: NotificationWire[];
      results?: NotificationWire[];
      total?: number;
      page?: number;
      pageSize?: number;
      totalPages?: number;
    };

type ServerToClientEvents = {
  notification: (data: NotificationWire) => void;
  message: (data: { id?: string | number; content?: string }) => void;
  'notifications:init': (list: NotificationInitPayload) => void;
  'notifications:error': (e: { message: string }) => void;
};

type ClientToServerEvents = Record<string, never>;

class SocketServiceClass {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

  private getBaseUrl(): string {
    const envUrl: string | undefined = process.env.EXPO_PUBLIC_API_URL;
    const extra: any = Constants?.expoConfig?.extra;
    const extraUrl: string | undefined = typeof extra?.apiUrl === 'string' ? extra.apiUrl : undefined;
    let base = '';
    if (envUrl && envUrl.length > 0) {
      base = envUrl;
    } else if (extraUrl && extraUrl.length > 0) {
      base = extraUrl;
    }

    // Fallback por plataforma en entorno local
    if (!base) {
      base = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
    }

    // En Android, si apuntamos a localhost/127.0.0.1, redirigir a 10.0.2.2 (emulador)
    if (Platform.OS === 'android' && base) {
      try {
        const url = new URL(base);
        if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
          url.hostname = '10.0.2.2';
          base = url.toString();
        }
      } catch {
        // Si no es una URL válida, no transformamos
      }
    }

    return base;
  }

  connect(user?: { id?: string | number; roles?: string[]; areaIds?: string[] }): Socket<ServerToClientEvents, ClientToServerEvents> {
    if (this.socket?.connected) {
      return this.socket;
    }
    const baseUrl = this.getBaseUrl();

    const query: Record<string, string> = {};
    if (user?.id) query.userId = String(user.id);
    if (user?.roles?.length) query.role = String(user.roles[0]);
    if (user?.areaIds?.length) query.area = String(user.areaIds[0]);

    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(baseUrl, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
      query,
    });

    this.socket = socket;
    return socket;
  }

  getSocket() {
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const SocketService = new SocketServiceClass();
