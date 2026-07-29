/**
 * The only requestAnimationFrame in the application (docs/adr/0005).
 *
 * Studios expose frame(dt) and the shell decides when — which is what lets us
 * throttle on a hot phone, pause hidden studios, and collect per-studio frame
 * budget telemetry without asking studios to cooperate.
 */
type Cb = (dt: number, now: number) => void;

class FrameLoop {
  private subs = new Map<string, Cb>();
  private raf = 0;
  private last = 0;
  private budgetMs = 8;
  /** Rolling per-studio cost, surfaced in dev tools and reported as RUM. */
  readonly cost = new Map<string, number>();

  subscribe(id: string, cb: Cb) {
    this.subs.set(id, cb);
    this.start();
    return () => {
      this.subs.delete(id);
      this.cost.delete(id);
      if (this.subs.size === 0) this.stop();
    };
  }

  private start() {
    if (this.raf) return;
    this.last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(now - this.last, 64);
      this.last = now;
      for (const [id, cb] of this.subs) {
        const t0 = performance.now();
        try { cb(dt, now); } catch (err) { console.error(`[studio:${id}]`, err); this.subs.delete(id); }
        const spent = performance.now() - t0;
        this.cost.set(id, (this.cost.get(id) ?? spent) * 0.9 + spent * 0.1);
      }
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  private stop() { cancelAnimationFrame(this.raf); this.raf = 0; }

  /** Called when the tab is hidden or the device reports thermal pressure. */
  setBudget(ms: number) { this.budgetMs = ms; }
  get budget() { return this.budgetMs; }
}

export const frameLoop = new FrameLoop();

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    frameLoop.setBudget(document.hidden ? 0 : 8);
  });
}
