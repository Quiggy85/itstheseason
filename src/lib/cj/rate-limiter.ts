const MIN_INTERVAL_MS = 300;

type Task = {
  fn: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
};

export class RateLimitedQueue {
  private readonly tasks: Task[] = [];
  private lastRun = 0;
  private processing = false;

  constructor(private readonly intervalMs: number = MIN_INTERVAL_MS) {}

  enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.tasks.push({
        fn,
        resolve: (value) => resolve(value as T),
        reject,
      });
      void this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing) return;

    this.processing = true;
    while (this.tasks.length > 0) {
      const elapsed = Date.now() - this.lastRun;
      if (elapsed < this.intervalMs) {
        await new Promise((resolve) => setTimeout(resolve, this.intervalMs - elapsed));
      }

      const task = this.tasks.shift();
      if (!task) break;

      this.lastRun = Date.now();

      try {
        const result = await task.fn();
        task.resolve(result);
      } catch (error) {
        task.reject(error);
      }
    }

    this.processing = false;
  }
}

declare global {
  var __CJ_RATE_LIMITER__: RateLimitedQueue | undefined;
}

export function getRateLimitedQueue(): RateLimitedQueue {
  if (!globalThis.__CJ_RATE_LIMITER__) {
    globalThis.__CJ_RATE_LIMITER__ = new RateLimitedQueue();
  }
  return globalThis.__CJ_RATE_LIMITER__;
}
