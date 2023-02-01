import { getRootStore } from '@app/stores';
import { message } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import JSONBigint from 'json-bigint';
import { Recordable } from '@app/interfaces/tools';
import { safeParse } from './function';
import { HttpResCode } from './http';

export interface MessageSend<T extends unknown = Recordable> {
  header: {
    msgId: string;
    version: string;
  };
  body: {
    product: string;
    msgType: string;
    content: T;
  };
}

export interface MessageReceive<T extends unknown = Recordable> {
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
  message?: string;
}

export const WsHeartbeatReq = '1';
export const WsHeartbeatRes = '2';

type MessageReceiverProps<R = unknown> = {
  resolve: (res: R) => void;
  reject: () => void;
  content: MessageSend['body']['content'];
  product: string;
  msgType: string;
  config?: Recordable;
};

export class MessageReceiver<R extends NgqlRes = NgqlRes> {
  resolve: (res: R) => void;
  reject: () => void;
  onError?: (e: Error) => void;
  messageSend: MessageSend;
  config?: Recordable;

  sendTime = Date.now();

  constructor(props: MessageReceiverProps<R>) {
    const { resolve, reject, content, product, msgType, config = {} } = props;
    this.resolve = resolve;
    this.reject = reject;
    this.config = config;
    this.messageSend = {
      header: { msgId: uuidv4(), version: '1.0' },
      body: { product, msgType, content },
    };
  }
}

export class NgqlRunner {
  socket: WebSocket | undefined = undefined;

  socketUrl: string | URL | undefined;
  socketProtocols: string | string[] | undefined;

  product = 'Studio';

  socketMessageListeners: ((e: MessageEvent) => void)[] = [];
  messageReceiverMap = new Map<string, MessageReceiver>();

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

  clearSocketMessageListener = () => {
    this.socketMessageListeners.forEach((l) => this.socket?.removeEventListener('message', l));
    this.socketMessageListeners = [];
  };

  rmSocketMessageListener = (listener: (e: MessageEvent) => void) => {
    this.socket?.removeEventListener('message', listener);
    this.socketMessageListeners = this.socketMessageListeners.filter((l) => l !== listener);
  };

  clearMessageReceiver = () => {
    this.messageReceiverMap.forEach((receiver) => receiver.resolve({ code: -1, message: 'WebSocket closed' }));
    this.messageReceiverMap.clear();
  };

  connect = (url: string | URL, protocols?: string | string[]) => {
    if (!url) {
      getRootStore().global.logout();
      message.error('WebSocket URL is empty');
      return Promise.reject('WebSocket URL is empty');
    }

    if (this.socketConnectingPromise) {
      return this.socketConnectingPromise;
    } else if (this.socket?.readyState === WebSocket.OPEN) {
      this.desctory();
    }
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
        this.socketConnectingPromise = undefined;

        socket.onerror = undefined;
        socket.onclose = undefined;

        this.socket.addEventListener('close', this.onDisconnect);
        this.socket.addEventListener('error', this.onError);
        this.socket.addEventListener('message', this.onMessage);

        resolve(true);
      };
      socket.onerror = (e) => {
        console.error('=====ngqlSocket error', e);
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

  onMessage = (e: MessageEvent<string>) => {
    if (e.data === WsHeartbeatRes) {
      return;
    }

    const msgReceive = safeParse<MessageReceive<NgqlRes>>(e.data, { paser: JSONBigint.parse });
    if (msgReceive?.body?.content?.code === HttpResCode.ErrSession) {
      getRootStore().global.logout();
      return;
    }

    const messageReceiver = this.messageReceiverMap.get(msgReceive?.header?.msgId);
    if (messageReceiver && msgReceive.header.msgId === messageReceiver.messageSend.header.msgId) {
      const content = msgReceive.body.content;
      if (messageReceiver.config.noTip !== true && content.code !== 0) {
        message.error(content.message);
      }
      messageReceiver.resolve(content);
      this.messageReceiverMap.delete(msgReceive.header.msgId);
    }
  };

  onError = (e: Event) => {
    console.error('=====ngqlSocket error', e);
    message.error('WebSocket error, try to reconnect...');
    this.onDisconnect();
  };

  onDisconnect = () => {
    console.log('=====onDisconnect');
    this.socket?.removeEventListener('close', this.onDisconnect);
    this.socket?.removeEventListener('error', this.onError);

    this.clearMessageReceiver();
    this.closeSocket();

    // try reconnect
    this.socketUrl && setTimeout(this.reConnect, 1000);
  };

  closeSocket = () => {
    this.socket?.close();
    this.socket = undefined;

    clearTimeout(this.socketPingTimeInterval);
    this.socketPingTimeInterval = undefined;
  };

  desctory = () => {
    // disable reconnect
    this.socketUrl = undefined;
    this.socketProtocols = undefined;

    this.onDisconnect();
  };

  ping = () => {
    this.socket?.readyState === WebSocket.OPEN && this.socket.send(WsHeartbeatReq);
  };

  runNgql = async (
    { gql, paramList, space }: { gql: string; paramList?: string[]; space?: string },
    config: Recordable = {},
  ): Promise<NgqlRes> => {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      const flag = await this.reConnect();
      if (!flag) {
        return Promise.resolve({ code: -1, message: 'WebSocket reconnect failed' });
      }
    }

    return new Promise((resolve, reject) => {
      const messageReceiver = new MessageReceiver({
        resolve,
        reject,
        product: this.product,
        content: { gql, paramList, space },
        config,
        msgType: 'ngql',
      });

      this.socket.send(JSON.stringify(messageReceiver.messageSend));
      this.messageReceiverMap.set(messageReceiver.messageSend.header.msgId, messageReceiver);
    });
  };

  runBatchNgql = async (
    { gqls, paramList, space }: { gqls: string[]; paramList?: string[]; space?: string },
    config: Recordable = {},
  ): Promise<NgqlRes> => {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      await this.reConnect();
    }

    return new Promise((resolve, reject) => {
      const messageReceiver = new MessageReceiver({
        resolve,
        reject,
        product: this.product,
        content: { gqls, paramList, space },
        config,
        msgType: 'batch_ngql',
      });

      this.socket.send(JSON.stringify(messageReceiver.messageSend));
      this.messageReceiverMap.set(messageReceiver.messageSend.header.msgId, messageReceiver);
    });
  };
}

const ngqlRunner = new NgqlRunner();

// for HMR, ensure only one socket
window.__ngqlRunner__?.desctory();
window.__ngqlRunner__ = ngqlRunner;

export default ngqlRunner;
