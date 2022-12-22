import { v4 as uuidv4 } from 'uuid';
import { safeParse } from './function';

interface MessageReceive {
  header: {
    msgId: string;
    sendTime: number;
  };
  body: {
    msgType: string;
    content: Record<string, unknown>;
  };
}

export class NgqlRunner {
  socket: WebSocket | undefined;

  socketUrl: string | URL | undefined;
  socketProtocols: string | string[] | undefined;

  socketMessageListeners: Array<(e: MessageEvent) => void> = [];

  constructor() {
    this.socket = undefined;
  }

  addSocketMessageListener = (listener: (e: MessageEvent) => void) => {
    this.socket?.addEventListener('message', listener);
    this.socketMessageListeners.push(listener);
  };

  rmSocketMessageListener = (listener: (e: MessageEvent) => void) => {
    this.socket?.removeEventListener('message', listener);
    this.socketMessageListeners = this.socketMessageListeners.filter(l => l !== listener);
  };

  clearSocketMessageListener = () => {
    this.socketMessageListeners.forEach((l) => {
      this.socket?.removeEventListener('message', l);
    });
    this.socketMessageListeners = [];
  };

  connect = (url: string, protocols?: string | string[]) =>
    new Promise<boolean>((resolve) => {
      const socket = new WebSocket(url, protocols);
      socket.onopen = () => {
        console.log('=====ngqlSocket open');
        this.socket = socket;
        this.socketUrl = url;
        this.socketProtocols = protocols;
        resolve(true);
      };
      socket.onerror = (e) => {
        console.error('=====ngqlSocket error', e);
        resolve(false);
      };
      socket.onclose = () => {
        console.log('=====ngqlSocket close');
        this.socket = undefined;
      };
    });

  disconnect = () => {
    this.clearSocketMessageListener();
    this.socket?.close();
    this.socket = undefined;
    this.socketUrl = undefined;
    this.socketProtocols = undefined;
  };

  ping = () => {
    this.socket?.send('ping');
  };

  runNgql = ({ gql }: { gql: string }, _config: any) => {
    const message = {
      header: {
        msgId: uuidv4(),
        version: '1.0',
      },
      body: {
        product: 'Studio',
        msgType: 'ngql',
        content: { gql },
      },
    };

    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error('socket is not ready'));
    }

    return new Promise((resolve) => {
      const receiveMsg = (e: MessageEvent<string>) => {
        const msgReceive = safeParse<MessageReceive>(e.data);
        if (msgReceive.header.msgId === message.header.msgId) {
          resolve(msgReceive.body.content);
          this.rmSocketMessageListener(receiveMsg);
        }
      };

      this.socket?.send(JSON.stringify(message));
      this.addSocketMessageListener(receiveMsg);
    });
  };
}

const ngqlRunner = new NgqlRunner();

export default ngqlRunner;
