/**
 * WebSocket wrapper that handles binary (Blob/ArrayBuffer) responses
 *
 * Problem: Nodit WebSocket sends binary frames for subscription messages,
 * which browsers receive as Blob by default. viem's WebSocket handler
 * expects text/string messages and fails with JSON.parse("[object Blob]").
 *
 * Solution: Set binaryType to 'arraybuffer' and convert to text before
 * the message event reaches viem's handler.
 */

/**
 * Create a WebSocket class that automatically handles binary responses
 * by converting them to text strings.
 */
export function createTextWebSocket(url: string): WebSocket {
  const ws = new WebSocket(url);

  // Set binaryType to arraybuffer for easier conversion
  ws.binaryType = 'arraybuffer';

  // Store the original addEventListener
  const originalAddEventListener = ws.addEventListener.bind(ws);

  // Override addEventListener to intercept message events
  ws.addEventListener = function (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void {
    if (type === 'message') {
      // Wrap the message listener to convert binary data to text
      const wrappedListener = (event: MessageEvent) => {
        let data = event.data;

        // Convert ArrayBuffer to string
        if (data instanceof ArrayBuffer) {
          data = new TextDecoder().decode(data);
        }
        // Convert Blob to string (sync fallback - should not happen with arraybuffer)
        else if (data instanceof Blob) {
          // For Blob, we need async handling but viem expects sync
          // This shouldn't happen since we set binaryType to arraybuffer
          console.warn('[blob-websocket-transport] Unexpected Blob received');
        }

        // Create a new MessageEvent with the converted data
        const newEvent = new MessageEvent('message', {
          data,
          origin: event.origin,
          lastEventId: event.lastEventId,
          source: event.source,
          ports: [...event.ports],
        });

        // Call the original listener
        if (typeof listener === 'function') {
          listener(newEvent);
        } else {
          listener.handleEvent(newEvent);
        }
      };

      originalAddEventListener(type, wrappedListener as EventListener, options);
    } else {
      originalAddEventListener(type, listener, options);
    }
  };

  return ws;
}

/**
 * Store original WebSocket before patching
 */
let originalWebSocket: typeof WebSocket | null = null;

/**
 * Save original WebSocket before patching
 * Call this before patchGlobalWebSocket()
 */
export function saveOriginalWebSocket(): void {
  if (typeof window !== 'undefined' && !originalWebSocket) {
    originalWebSocket = window.WebSocket;
  }
}

/**
 * Restore the original WebSocket if it was patched
 */
export function restoreOriginalWebSocket(): void {
  if (typeof window !== 'undefined' && originalWebSocket) {
    (window as unknown as { WebSocket: typeof WebSocket }).WebSocket = originalWebSocket;
  }
}

/**
 * Polyfill the global WebSocket to use text mode
 * Call this before creating viem WebSocket clients
 *
 * WARNING: This affects ALL WebSocket connections in the application
 */
export function patchGlobalWebSocket(): void {
  if (typeof window === 'undefined') return;

  // Save original if not already saved
  if (!originalWebSocket) {
    originalWebSocket = window.WebSocket;
  }

  const OriginalWebSocket = originalWebSocket;

  // Create a proxy WebSocket class
  class PatchedWebSocket extends EventTarget {
    private ws: WebSocket;
    private userOnMessage: ((event: MessageEvent) => void) | null = null;
    private userOnOpen: ((event: Event) => void) | null = null;
    private userOnClose: ((event: CloseEvent) => void) | null = null;
    private userOnError: ((event: Event) => void) | null = null;

    // Static properties
    static readonly CONNECTING = 0;
    static readonly OPEN = 1;
    static readonly CLOSING = 2;
    static readonly CLOSED = 3;

    constructor(url: string | URL, protocols?: string | string[]) {
      super();
      console.log('[PatchedWS] Creating WebSocket to:', url);
      this.ws = new OriginalWebSocket(url, protocols);

      // Set binaryType to arraybuffer for binary-to-text conversion
      this.ws.binaryType = 'arraybuffer';

      // Forward events with message conversion
      this.ws.addEventListener('message', (event: MessageEvent) => {
        console.log('[PatchedWS] Message received, type:', typeof event.data, 'isArrayBuffer:', event.data instanceof ArrayBuffer);
        const convertedEvent = this.convertMessageEvent(event);
        console.log('[PatchedWS] Converted data type:', typeof convertedEvent.data);
        this.dispatchEvent(convertedEvent);
        if (this.userOnMessage) {
          this.userOnMessage(convertedEvent);
        }
      });

      this.ws.addEventListener('open', (event: Event) => {
        console.log('[PatchedWS] Connection opened');
        // Create a new event to avoid "already being dispatched" error
        const newEvent = new Event('open');
        this.dispatchEvent(newEvent);
        if (this.userOnOpen) {
          this.userOnOpen(event);
        }
      });

      this.ws.addEventListener('close', (event: CloseEvent) => {
        console.log('[PatchedWS] Connection closed:', event.code, event.reason);
        // Create a new CloseEvent to avoid "already being dispatched" error
        // Note: CloseEvent constructor has limited browser support
        // We dispatch asynchronously to avoid the error
        Promise.resolve().then(() => {
          const newEvent = new CloseEvent('close', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
          });
          this.dispatchEvent(newEvent);
        });
        if (this.userOnClose) {
          this.userOnClose(event);
        }
      });

      this.ws.addEventListener('error', (event: Event) => {
        console.error('[PatchedWS] Connection error');
        // Create a new event to avoid "already being dispatched" error
        const newEvent = new Event('error');
        this.dispatchEvent(newEvent);
        if (this.userOnError) {
          this.userOnError(event);
        }
      });
    }

    private convertMessageEvent(event: MessageEvent): MessageEvent {
      let data = event.data;

      // Convert ArrayBuffer to string
      if (data instanceof ArrayBuffer) {
        data = new TextDecoder().decode(data);
      }

      return new MessageEvent('message', {
        data,
        origin: event.origin,
        lastEventId: event.lastEventId,
        source: event.source,
        ports: [...event.ports],
      });
    }

    // Proxy getters
    get readyState(): number {
      return this.ws.readyState;
    }

    get bufferedAmount(): number {
      return this.ws.bufferedAmount;
    }

    get extensions(): string {
      return this.ws.extensions;
    }

    get protocol(): string {
      return this.ws.protocol;
    }

    get url(): string {
      return this.ws.url;
    }

    get binaryType(): BinaryType {
      return this.ws.binaryType;
    }

    set binaryType(value: BinaryType) {
      // Ignore attempts to change binaryType - we always use arraybuffer
      // This is intentional to ensure binary frames are converted to text
    }

    // Event handler properties
    get onmessage(): ((event: MessageEvent) => void) | null {
      return this.userOnMessage;
    }

    set onmessage(handler: ((event: MessageEvent) => void) | null) {
      this.userOnMessage = handler;
    }

    get onopen(): ((event: Event) => void) | null {
      return this.userOnOpen;
    }

    set onopen(handler: ((event: Event) => void) | null) {
      this.userOnOpen = handler;
    }

    get onclose(): ((event: CloseEvent) => void) | null {
      return this.userOnClose;
    }

    set onclose(handler: ((event: CloseEvent) => void) | null) {
      this.userOnClose = handler;
    }

    get onerror(): ((event: Event) => void) | null {
      return this.userOnError;
    }

    set onerror(handler: ((event: Event) => void) | null) {
      this.userOnError = handler;
    }

    // Proxy methods
    send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
      this.ws.send(data);
    }

    close(code?: number, reason?: string): void {
      this.ws.close(code, reason);
    }
  }

  // Replace global WebSocket
  (window as unknown as { WebSocket: typeof WebSocket }).WebSocket =
    PatchedWebSocket as unknown as typeof WebSocket;
}
