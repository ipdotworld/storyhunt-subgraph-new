import { createPublicClient, webSocket, type PublicClient, type Chain } from 'viem';
import type {
  SubscriptionConfig,
  SubscriptionHandle,
  ConnectionStatus,
} from './types';
import { RECONNECT_CONFIG, FLAPPING_CONFIG } from './constants';

interface SubscriptionInfo extends SubscriptionHandle {
  config: SubscriptionConfig;
  clientUnsubscribe?: () => void;
}

export class SubscriptionManager {
  private client: PublicClient | null = null;
  private chain: Chain;
  private wsUrl: string;
  private subscriptions = new Map<string, SubscriptionInfo>();
  private connectionStatus: ConnectionStatus = 'disconnected';
  private connectionCallbacks: ((status: ConnectionStatus) => void)[] = [];
  private reconnectAttempts = 0;
  private isReconnecting = false;
  private wasUserDisconnect = false;
  private disconnectTimestamps: number[] = [];
  private flappingPauseUntil = 0;

  constructor(chain: Chain, wsUrl: string) {
    this.chain = chain;
    this.wsUrl = wsUrl;
  }

  async connect(): Promise<void> {
    if (this.connectionStatus === 'connecting' || this.connectionStatus === 'connected') {
      console.log('[SM] Already connecting/connected, skipping');
      return;
    }

    this.wasUserDisconnect = false;
    this.setConnectionStatus('connecting');
    console.log('[SM] Connecting to WebSocket:', this.wsUrl);

    try {
      this.client = createPublicClient({
        chain: this.chain,
        transport: webSocket(this.wsUrl, {
          reconnect: {
            attempts: 5,
            delay: 1000,
          },
          keepAlive: {
            interval: 30000,
          },
        }),
      });

      this.reconnectAttempts = 0;
      this.setConnectionStatus('connected');
      console.log('[SM] WebSocket connected successfully');
    } catch (error) {
      console.error('[SM] WebSocket connection failed:', error);
      this.client = null;
      this.setConnectionStatus('disconnected');
      throw new Error(`Failed to connect WebSocket: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async disconnect(): Promise<void> {
    this.wasUserDisconnect = true;
    await this.unsubscribeAll();

    if (this.client) {
      this.client = null;
    }

    this.setConnectionStatus('disconnected');
    this.isReconnecting = false;
  }

  isConnected(): boolean {
    return this.client !== null && this.connectionStatus === 'connected';
  }

  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  subscribe(config: SubscriptionConfig): SubscriptionHandle {
    if (!this.isConnected()) {
      throw new Error('SubscriptionManager is not connected. Call connect() first.');
    }

    const id = this.generateSubscriptionId();
    const handle: SubscriptionInfo = {
      id,
      type: config.type,
      status: 'active',
      config,
      unsubscribe: () => this.unsubscribe(id),
    };

    this.subscriptions.set(id, handle);

    return {
      id,
      type: config.type,
      status: 'active',
      unsubscribe: () => this.unsubscribe(id),
    };
  }

  private unsubscribe(id: string): void {
    const sub = this.subscriptions.get(id);
    if (sub) {
      if (sub.clientUnsubscribe) {
        sub.clientUnsubscribe();
      }
      sub.status = 'inactive';
      this.subscriptions.delete(id);
    }
  }

  async unsubscribeAll(): Promise<void> {
    for (const [id] of this.subscriptions) {
      this.unsubscribe(id);
    }
  }

  getActiveSubscriptions() {
    return Array.from(this.subscriptions.values()).map((sub) => ({
      id: sub.id,
      type: sub.type,
      status: sub.status,
    }));
  }

  onConnectionChange(callback: (status: ConnectionStatus) => void): () => void {
    this.connectionCallbacks.push(callback);

    return () => {
      const index = this.connectionCallbacks.indexOf(callback);
      if (index > -1) {
        this.connectionCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Handle an unexpected disconnection (not initiated by the user).
   * Triggers reconnection with subscription restoration unless:
   * - The user explicitly called disconnect()
   * - Network flapping is detected
   * - Maximum reconnect attempts are exhausted
   */
  async handleUnexpectedDisconnect(): Promise<boolean> {
    if (this.wasUserDisconnect) {
      console.log('[SM] User-initiated disconnect, skipping reconnection');
      return false;
    }

    // Record this disconnection for flapping detection
    const now = Date.now();
    this.disconnectTimestamps.push(now);

    // Check for flapping
    if (this.isFlapping(now)) {
      console.warn(
        `[SM] Flapping detected: ${FLAPPING_CONFIG.threshold} disconnections within ${FLAPPING_CONFIG.windowMs / 1000}s. ` +
        `Pausing reconnection for ${FLAPPING_CONFIG.pauseMs / 1000}s.`
      );
      this.flappingPauseUntil = now + FLAPPING_CONFIG.pauseMs;
      this.setConnectionStatus('disconnected');
      return false;
    }

    // Check if we are still in a flapping pause period
    if (now < this.flappingPauseUntil) {
      const remainingMs = this.flappingPauseUntil - now;
      console.warn(`[SM] Still in flapping pause. ${Math.ceil(remainingMs / 1000)}s remaining.`);
      return false;
    }

    // Store subscription configs before reconnecting
    const savedConfigs = this.collectSubscriptionConfigs();

    // Clean up current state: clear subscriptions map so restoration does not duplicate
    this.subscriptions.clear();
    this.client = null;
    this.setConnectionStatus('reconnecting');

    // Attempt reconnection loop
    while (this.reconnectAttempts < RECONNECT_CONFIG.maxAttempts) {
      const success = await this.attemptReconnect();
      if (success) {
        // Restore all previously active subscriptions
        await this.restoreSubscriptions(savedConfigs);
        console.info(
          `[SM] Reconnected and restored ${savedConfigs.length} subscription(s) after ${this.reconnectAttempts} attempt(s)`
        );
        return true;
      }
    }

    console.error('[SM] All reconnection attempts exhausted');
    this.setConnectionStatus('disconnected');
    return false;
  }

  /**
   * Returns true if the manager is currently in a flapping pause state.
   */
  isInFlappingPause(): boolean {
    return Date.now() < this.flappingPauseUntil;
  }

  /**
   * Returns the timestamp array of recent disconnections (for testing/observability).
   */
  getDisconnectTimestamps(): readonly number[] {
    return [...this.disconnectTimestamps];
  }

  private setConnectionStatus(status: ConnectionStatus): void {
    if (this.connectionStatus !== status) {
      this.connectionStatus = status;
      this.connectionCallbacks.forEach((cb) => cb(status));
    }
  }

  private async attemptReconnect(): Promise<boolean> {
    if (this.isReconnecting) {
      return false;
    }

    if (this.reconnectAttempts >= RECONNECT_CONFIG.maxAttempts) {
      console.error('Max reconnection attempts exceeded');
      return false;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;

    try {
      const delay = RECONNECT_CONFIG.baseDelay * Math.pow(2, this.reconnectAttempts - 1);
      const jitter = delay * RECONNECT_CONFIG.jitterFactor * Math.random();
      const totalDelay = Math.min(delay + jitter, RECONNECT_CONFIG.maxDelay);

      await new Promise((resolve) => setTimeout(resolve, totalDelay));

      await this.connect();
      console.info(`Reconnected successfully after ${this.reconnectAttempts} attempts`);
      this.isReconnecting = false;
      return true;
    } catch (error) {
      console.warn(`Reconnection attempt ${this.reconnectAttempts} failed:`, error);
      this.isReconnecting = false;
      return false;
    }
  }

  /**
   * Detect network flapping: too many disconnections within a short window.
   */
  private isFlapping(now: number): boolean {
    const cutoff = now - FLAPPING_CONFIG.windowMs;
    // Prune old timestamps outside the window
    this.disconnectTimestamps = this.disconnectTimestamps.filter((ts) => ts > cutoff);
    return this.disconnectTimestamps.length >= FLAPPING_CONFIG.threshold;
  }

  /**
   * Collect configs from all currently tracked subscriptions.
   * This snapshot is taken before clearing state so subscriptions can be restored.
   */
  private collectSubscriptionConfigs(): SubscriptionConfig[] {
    return Array.from(this.subscriptions.values()).map((sub) => sub.config);
  }

  /**
   * Restore subscriptions from saved configs after a successful reconnection.
   */
  private async restoreSubscriptions(configs: SubscriptionConfig[]): Promise<void> {
    for (const config of configs) {
      try {
        this.subscribe(config);
      } catch (error) {
        console.warn(`[SM] Failed to restore subscription (type=${config.type}):`, error);
      }
    }
  }

  private generateSubscriptionId(): string {
    return `sub-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}
