import { message } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import JSONBigint from 'json-bigint';
import { Recordable } from '@app/interfaces/tools';
import { safeParse } from './function';
import { HttpResCode } from './http';

export enum MsgType {
  NGQL = 'ngql',
  BatchNGQL = 'batch_ngql',
}

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

export interface MessageReceive<T extends unknown = unknown> {
  header: {
    msgId: string;
    sendTime: number;
  };
  body: {
    msgType: string;
    content: T;
  };
}

export interface MsgReceivedProcessor {
  // e.g. (msgReceive: MessageReceive) => msgReceive.body.msgType === MsgType.Definition
  condetion: (msgReceive: MessageReceive) => boolean;
  execute: (msgReceive: MessageReceive) => void;
}

export interface NgqlRes<T = any> {
  code: number;
  data?: T;
  message?: string;
}

export const WsHeartbeatReq = '1';
export const WsHeartbeatRes = '2';

interface MessageReceiverProps<R = unknown> {
  resolve: (res: R) => void;
  reject: () => void;
  content: MessageSend['body']['content'];
  product: string;
  msgType: string;
  config?: Recordable;
}

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
  logoutFun: () => void = undefined;
  product = 'Studio';

  socketMessageListeners: ((e: MessageEvent) => void)[] = [];
  messageReceiverMap = new Map<string, MessageReceiver>();

  socketConnectingPromise: Promise<boolean> | undefined;
  socketPingTimeInterval: number | undefined;

  msgReceivedProcessors: MsgReceivedProcessor[] = [];

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

  connect = (payload: {
    config: {
      url: string | URL;
      protocols?: string | string[];
    };
    logoutFun?: () => void;
  }) => {
    const {
      config: { url, protocols },
      logoutFun,
    } = payload;
    if (!url) {
      logoutFun?.();
      console.error('WebSocket URL is empty');
      // return Promise.reject('WebSocket URL is empty');
      return;
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
        logoutFun && (this.logoutFun = logoutFun);
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
    return this.connect({
      config: {
        url: this.socketUrl,
        protocols: this.socketProtocols,
      },
    });
  };

  onMessage = (e: MessageEvent<string>) => {
    if (e.data === WsHeartbeatRes) {
      return;
    }

    const msgReceive = safeParse<MessageReceive<any>>(e.data, { paser: JSONBigint.parse });

    const processor = this.msgReceivedProcessors.find((p) => p.condetion(msgReceive));
    if (typeof processor?.execute === 'function') {
      processor.execute(msgReceive);
      return;
    }

    if (msgReceive?.body?.content?.code === HttpResCode.ErrSession) {
      msgReceive?.body?.content?.message && message.error(msgReceive.body.content.message);
      this.logoutFun?.();
      return;
    }

    const messageReceiver = this.messageReceiverMap.get(msgReceive?.header?.msgId);
    if (messageReceiver && msgReceive.header.msgId === messageReceiver.messageSend.header.msgId) {
      const content = msgReceive.body.content;
      if (messageReceiver.config.noTip !== true && content.code !== 0) {
        message.error(content.message);
      }
      messageReceiver.resolve(content);
      if (messageReceiver?.config?.notClear !== true) {
        this.messageReceiverMap.delete(msgReceive.header.msgId);
      }
    }
  };

  onError = (e: Event) => {
    console.error('=====ngqlSocket error', e);
    message.error('WebSocket error, try to reconnect...');
    this.onDisconnect(e);
  };

  onDisconnect = (e?: CloseEvent | Event) => {
    console.log('=====onDisconnect', e);
    this.socket?.removeEventListener('close', this.onDisconnect);
    this.socket?.removeEventListener('error', this.onError);

    this.clearMessageReceiver();
    this.closeSocket();

    const { code, reason } = (e as CloseEvent) || {};
    reason && message.error(`WebSocket closed unexpectedly, code: ${code}, reason: \`${reason}\`, try to reconnect...`);

    // try reconnect
    this.socketUrl && setTimeout(this.reConnect, 3000);
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
    this.logoutFun = undefined;
    this.onDisconnect();
  };

  ping = () => {
    this.socket?.readyState === WebSocket.OPEN && this.socket.send(WsHeartbeatReq);
  };

  runNgql = async (params: { gql: string; space?: string }, config: Recordable = {}): Promise<NgqlRes> => {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      const flag = await this.reConnect();
      if (!flag) {
        if (config.noTip !== true) {
          console.error('WebSocket reconnect failed');
        }
        return Promise.resolve({ code: -1, message: 'WebSocket reconnect failed' });
      }
    }

    return new Promise((resolve, reject) => {
      const messageReceiver = new MessageReceiver({
        resolve,
        reject,
        product: this.product,
        content: params,
        config,
        msgType: MsgType.NGQL,
      });

      this.socket.send(JSON.stringify(messageReceiver.messageSend));
      this.messageReceiverMap.set(messageReceiver.messageSend.header.msgId, messageReceiver);
    });
  };

  runBatchNgql = async (
    { gqls, space }: { gqls: string[]; space?: string },
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
        content: { gqls, space },
        config,
        msgType: MsgType.BatchNGQL,
      });

      this.socket.send(JSON.stringify(messageReceiver.messageSend));
      this.messageReceiverMap.set(messageReceiver.messageSend.header.msgId, messageReceiver);
    });
  };

  runChat = async ({ req, callback }: { req: any; callback?: (str: any) => void }, config: Recordable = {}) => {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      await this.reConnect();
    }

    return new Promise((resolve, reject) => {
      if (req.stream) {
        resolve(req.stream);
      }
      const messageReceiver = new MessageReceiver<any>({
        resolve: req.stream ? callback : resolve, // when stream don't use promise to reveive data
        reject,
        product: this.product,
        content: req,
        config,
        msgType: 'llm',
      });
      config.notClear = true;

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
