import { getRootStore } from '@app/stores';
import { message } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import { safeParse } from './function';
import { HttpResCode } from './http';

export interface MessageReceive<T extends unknown = Record<string, unknown>> {
  header: {
    msgId: string;
    sendTime: number;
  };
  body: {
    msgType: string;
    content: T;
  };
}

export interface NgqlRes<T = any> {
  code: number;
  data?: T;
  message: string;
}

export const WsHeartbeatReq = '1';
export const WsHeartbeatRes = '2';

export class NgqlRunner {
  socket: WebSocket | undefined = undefined;

  socketUrl: string | URL | undefined;
  socketProtocols: string | string[] | undefined;

  socketMessageListeners: Array<(e: MessageEvent) => void> = [];

  socketIsConnecting = false;
  socketConnectingPromise: Promise<boolean> | undefined;
  socketPingTimeInterval: number | undefined;

  constructor() {
    const urlItem = localStorage.getItem('socketUrl');
    const protocolsItem = localStorage.getItem('socketProtocols');

    urlItem && (this.socketUrl = safeParse<string>(urlItem));
    protocolsItem && (this.socketProtocols = safeParse<string>(protocolsItem));
  }

  addSocketMessageListener = (listener: (e: MessageEvent) => void) => {
    this.socket?.addEventListener('message', listener);
    this.socketMessageListeners.push(listener);
  };

  rmSocketMessageListener = (listener: (e: MessageEvent) => void) => {
    this.socket?.removeEventListener('message', listener);
    this.socketMessageListeners = this.socketMessageListeners.filter((l) => l !== listener);
  };

  clearSocketMessageListener = () => {
    this.socketMessageListeners.forEach((l) => {
      this.socket?.removeEventListener('message', l);
    });
    this.socketMessageListeners = [];
  };

  connect = (url: string | URL, protocols?: string | string[]) => {
    if (this.socketIsConnecting) {
      return this.socketConnectingPromise;
    } else if (this.socket?.readyState === WebSocket.OPEN) {
      return Promise.resolve(true);
    }
    this.socketIsConnecting = true;
    this.socketConnectingPromise = new Promise<boolean>((resolve) => {
      const socket = new WebSocket(url, protocols);
      socket.onopen = () => {
        console.log('=====ngqlSocket open');
        this.socket = socket;
        this.socketUrl = url;
        this.socketProtocols = protocols;

        localStorage.setItem('socketUrl', JSON.stringify(url));
        protocols && localStorage.setItem('socketProtocols', JSON.stringify(protocols));

        if (this.socketPingTimeInterval) {
          clearTimeout(this.socketPingTimeInterval);
        }
        this.socketPingTimeInterval = window.setInterval(this.ping, 1000 * 30);
        this.socketIsConnecting = false;
        this.socketConnectingPromise = undefined;

        socket.onerror = undefined;
        socket.onclose = undefined;

        // reconnect
        this.socket.addEventListener('close', this.onDisconnect);
        this.socket.addEventListener('error', this.onError);

        resolve(true);
      };
      socket.onerror = (e) => {
        console.error('=====ngqlSocket error', e);
        this.socketIsConnecting = false;
        this.socketConnectingPromise = undefined;
        resolve(false);
      };
      socket.onclose = () => {
        console.log('=====ngqlSocket close');
        this.socket = undefined;
      };
    });
    return this.socketConnectingPromise;
  };

  reConnect = () => {
    return this.connect(this.socketUrl, this.socketProtocols);
  };

  onError = (e: Event) => {
    console.error('=====ngqlSocket error', e);
    message.error('WebSocket error, try to reconnect...');
    this.onDisconnect();
  };

  onDisconnect = () => {
    this.socket?.removeEventListener('close', this.onDisconnect);
    this.socket?.removeEventListener('error', this.onError);
    this.clearSocketMessageListener();
    this.socket?.close();

    clearTimeout(this.socketPingTimeInterval);
    this.socketPingTimeInterval = undefined;
    this.socket = undefined;

    this.socketUrl && setTimeout(this.reConnect, 1000);
  };

  desctory = () => {
    clearTimeout(this.socketPingTimeInterval);
    this.clearSocketMessageListener();
    this.socket?.close();
    this.socket = undefined;
    this.socketUrl = undefined;
    this.socketProtocols = undefined;
  };

  ping = () => {
    this.socket?.readyState === WebSocket.OPEN && this.socket.send(WsHeartbeatReq);
  };

  runNgql = async (
    { gql, paramList }: { gql: string; paramList?: string[] },
    _config: any,
  ): Promise<{ code: number; data?: any; message: string }> => {
    const message = {
      header: {
        msgId: uuidv4(),
        version: '1.0',
      },
      body: {
        product: 'Studio',
        msgType: 'ngql',
        content: { gql, paramList },
      },
    };

    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      await this.reConnect();
    }

    return new Promise((resolve) => {
      const receiveMsg = (e: MessageEvent<string>) => {
        if (e.data === WsHeartbeatRes) {
          return;
        }
        const msgReceive = safeParse<MessageReceive<NgqlRes>>(e.data);
        if (msgReceive?.body?.content?.code === HttpResCode.ErrSession) {
          this.desctory();
          getRootStore().global.logout();
          return;
        }
        if (msgReceive?.header?.msgId === message.header.msgId) {
          resolve(msgReceive.body.content);
          this.rmSocketMessageListener(receiveMsg);
        }
      };

      this.socket?.send(JSON.stringify(message));
      this.addSocketMessageListener(receiveMsg);
    });
  };

  runBatchNgql = async (
    { gqls, paramList }: { gqls: string[]; paramList?: string[] },
    _config: any,
  ): Promise<{ code: number; data?: any[]; message: string }> => {
    const message = {
      header: {
        msgId: uuidv4(),
        version: '1.0',
      },
      body: {
        product: 'Studio',
        msgType: 'batch_ngql',
        content: { gqls, paramList },
      },
    };

    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      await this.reConnect();
    }

    return new Promise((resolve) => {
      const receiveMsg = (e: MessageEvent<string>) => {
        if (e.data === WsHeartbeatRes) {
          return;
        }
        const msgReceive = safeParse<MessageReceive<NgqlRes>>(e.data);
        if (msgReceive?.body?.content?.code === HttpResCode.ErrSession) {
          this.desctory();
          getRootStore().global.logout();
          return;
        }
        if (msgReceive?.header?.msgId === message.header.msgId) {
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
