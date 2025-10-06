type Listener = (...args: any[]) => void;

class EventBus {
  private listeners: Map<string, Set<Listener>> = new Map();
  // Short-lived sticky cache for events that may fire before listeners mount
  private sticky: Map<string, { payload: any[]; expireAt: number }> = new Map();
  private stickyTtlMs = 4000; // keep at most a few seconds

  on(event: string, listener: Listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    // If there is a recent sticky payload for this event, deliver it immediately
    const cached = this.sticky.get(event);
    if (cached && Date.now() < cached.expireAt) {
      try {
        listener(...cached.payload);
      } catch {}
      // Consume once
      this.sticky.delete(event);
    }
    return () => this.off(event, listener);
  }

  off(event: string, listener: Listener) {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(listener);
      if (set.size === 0) this.listeners.delete(event);
    }
  }

  emit(event: string, ...args: any[]) {
    const set = this.listeners.get(event);
    if (set) {
      // Copy to prevent issues if listeners mutate the set
      Array.from(set).forEach((cb) => {
        try {
          cb(...args);
        } catch {}
      });
    } else {
      // No listeners yet: cache as sticky briefly so first subscriber gets it
      // We only do this for a few high-value events like 'toast'
      if (event === "toast") {
        this.sticky.set(event, {
          payload: args,
          expireAt: Date.now() + this.stickyTtlMs,
        });
      }
    }
  }
}

export const eventBus = new EventBus();
