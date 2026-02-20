import io from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const SOCKET_URL = Constants.expoConfig?.extra?.apiUrl?.replace('/api', '') || 'http://localhost:3000';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  async connect() {
    if (this.socket?.connected) {
      return this.socket;
    }

    try {
      const token = await SecureStore.getItemAsync('userToken');
      
      this.socket = io(SOCKET_URL, {
        auth: {
          token,
        },
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      this.socket.on('connect', () => {
        console.log('✅ Socket conectado:', this.socket.id);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('❌ Socket desconectado:', reason);
      });

      this.socket.on('error', (error) => {
        console.error('❌ Erro no socket:', error);
      });

      return this.socket;
    } catch (error) {
      console.error('Erro ao conectar socket:', error);
      throw error;
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  on(event, callback) {
    if (!this.socket) {
      console.warn('Socket não conectado. Conecte primeiro.');
      return;
    }

    this.socket.on(event, callback);
    
    // Armazena o listener para poder remover depois
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.socket) return;

    this.socket.off(event, callback);

    // Remove do registro de listeners
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (!this.socket?.connected) {
      console.warn('Socket não conectado. Não foi possível emitir evento:', event);
      return;
    }

    this.socket.emit(event, data);
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

export default new SocketService();
