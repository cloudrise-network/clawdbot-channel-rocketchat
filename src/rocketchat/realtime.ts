/**
 * Rocket.Chat Realtime API (DDP/WebSocket) client
 * 
 * Rocket.Chat uses DDP (Distributed Data Protocol) over WebSocket for realtime
 * features like message streaming, typing indicators, and presence.
 */

import WebSocket from "ws";

export type DDPMessage = {
  msg: string;
  id?: string;
  method?: string;
  params?: unknown[];
  result?: unknown;
  error?: { error: string; message: string };
  collection?: string;
  fields?: Record<string, unknown>;
  session?: string;
  subs?: string[];
};

export type RealtimeOpts = {
  baseUrl: string;
  userId: string;
  authToken: string;
  onMessage?: (msg: IncomingMessage) => void;
  onConnect?: () => void;
  onDisconnect?: (reason?: string) => void;
  onError?: (error: Error) => void;
  logger?: { debug?: (msg: string) => void; info?: (msg: string) => void };
};

export type IncomingMessage = {
  _id: string;
  rid: string;
  msg: string;
  ts: { $date: number } | string;
  u: { _id: string; username: string; name?: string };
  tmid?: string;
  t?: string;
  attachments?: Array<{
    title?: string;
    image_url?: string;
    audio_url?: string;
    video_url?: string;
  }>;
};

export class RocketChatRealtime {
  private ws: WebSocket | null = null;
  private opts: RealtimeOpts;
  private messageId = 0;
  private pendingCalls = new Map<string, {
    resolve: (result: unknown) => void;
    reject: (error: Error) => void;
  }>();
  private subscriptions = new Map<string, string>();
  private pingInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnected = false;
  private shouldReconnect = true;

  constructor(opts: RealtimeOpts) {
    this.opts = opts;
  }

  private getWsUrl(): string {
    const base = this.opts.baseUrl.replace(/^http/, "ws");
    return `${base}/websocket`;
  }

  private nextId(): string {
    return String(++this.messageId);
  }

  private send(msg: DDPMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = this.getWsUrl();
      this.opts.logger?.debug?.(`Connecting to ${wsUrl}`);
      
      this.ws = new WebSocket(wsUrl);

      this.ws.on("open", () => {
        // Send DDP connect message
        this.send({ msg: "connect", version: "1", support: ["1"] } as unknown as DDPMessage);
      });

      this.ws.on("message", async (data) => {
        try {
          const msg = JSON.parse(data.toString()) as DDPMessage;
          await this.handleMessage(msg, resolve);
        } catch (err) {
          this.opts.logger?.debug?.(`Failed to parse message: ${err}`);
        }
      });

      this.ws.on("close", (code, reason) => {
        this.isConnected = false;
        this.opts.onDisconnect?.(reason?.toString());
        this.stopPing();
        
        if (this.shouldReconnect) {
          this.scheduleReconnect();
        }
      });

      this.ws.on("error", (err) => {
        this.opts.onError?.(err);
        reject(err);
      });
    });
  }

  private async handleMessage(msg: DDPMessage, onConnected?: (value: void) => void): Promise<void> {
    switch (msg.msg) {
      case "connected":
        this.opts.logger?.debug?.("DDP connected, logging in...");
        await this.login();
        this.isConnected = true;
        this.startPing();
        this.opts.onConnect?.();
        onConnected?.();
        break;

      case "result":
        if (msg.id) {
          const pending = this.pendingCalls.get(msg.id);
          if (pending) {
            this.pendingCalls.delete(msg.id);
            if (msg.error) {
              pending.reject(new Error(msg.error.message));
            } else {
              pending.resolve(msg.result);
            }
          }
        }
        break;

      case "changed":
        if (msg.collection === "stream-room-messages") {
          const fields = msg.fields as { args?: IncomingMessage[] };
          const messages = fields?.args ?? [];
          for (const m of messages) {
            // Skip system messages
            if (m.t) continue;
            this.opts.onMessage?.(m);
          }
        }
        break;

      case "ping":
        this.send({ msg: "pong" });
        break;

      case "pong":
        // Response to our ping, connection is alive
        break;

      case "ready":
        // Subscription is ready
        this.opts.logger?.debug?.(`Subscription ready: ${msg.subs?.join(", ")}`);
        break;

      case "nosub":
        this.opts.logger?.debug?.(`Subscription failed: ${msg.id}`);
        break;
    }
  }

  private async login(): Promise<void> {
    await this.callMethod("login", [{ resume: this.opts.authToken }]);
  }

  async callMethod(method: string, params: unknown[] = []): Promise<unknown> {
    const id = this.nextId();
    return new Promise((resolve, reject) => {
      this.pendingCalls.set(id, { resolve, reject });
      this.send({
        msg: "method",
        method,
        id,
        params,
      });
    });
  }

  async subscribeToRoom(roomId: string): Promise<void> {
    if (this.subscriptions.has(roomId)) return;

    const id = this.nextId();
    this.subscriptions.set(roomId, id);
    
    this.opts.logger?.debug?.(`Subscribing to room: ${roomId} with sub id: ${id}`);

    this.send({
      msg: "sub",
      id,
      name: "stream-room-messages",
      params: [roomId, false],
    } as unknown as DDPMessage);
  }

  async subscribeToRooms(roomIds: string[]): Promise<void> {
    for (const roomId of roomIds) {
      await this.subscribeToRoom(roomId);
    }
  }

  private startPing(): void {
    this.pingInterval = setInterval(() => {
      this.send({ msg: "ping" });
    }, 25000);
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) return;
    this.opts.logger?.debug?.("Scheduling reconnect in 5s...");
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect().catch((err) => {
        this.opts.onError?.(err);
      });
    }, 5000);
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.stopPing();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  get connected(): boolean {
    return this.isConnected;
  }
}
