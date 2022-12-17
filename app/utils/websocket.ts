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
  }
}

export function createWebSocketConnection(param: {
  url: string | URL;
  protocols?: string | string[];
  onOpen?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  onError?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
}) {
  const { url, protocols } = param;
  const socket = new WebSocket(url, protocols);
  return socket;
}

export class NgqlRunner {
  socket: WebSocket | undefined;

  constructor() {
    this.socket = undefined;
  }

  connect = (url: string, protocols?: string | string[]) => new Promise<boolean>((resolve) => {
    const socket = new WebSocket(url, protocols);
    socket.onopen = () => {
      console.log('=====ngqlSocket open');
      this.socket = socket;
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

  runNgql = ({ gql }: { gql: string; }) => {
    const message = JSON.stringify({
      header: {
        msgId: uuidv4(),
        version: '1.0',
      },
      body: {
        product: 'Studio',
        msgType: 'ngql',
        content: { gql },
      },
    });

    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error('socket is not ready'));
    }

    return new Promise((resolve) => {
      const receiveMsg = (e: MessageEvent<string>) => {
        console.log('=====msg', e.data);
        const msgReceive = safeParse<MessageReceive>(e.data);
        resolve(msgReceive.body.content);
        this.socket?.removeEventListener('message', receiveMsg);
      };
  
      this.socket?.send(message);
      this.socket?.addEventListener('message', receiveMsg);
    });
  };
}
