import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug' | 'trace' | 'group' | 'groupCollapsed' | 'groupEnd';

type LogEntry = {
  id: number;
  level: LogLevel;
  time: number;
  args: unknown[];
  stack?: string;
  groupLevel: number;
};

declare global {
  interface Window {
    __emeraldConsolePanel?: {
      toggle: () => void;
      open: () => void;
      close: () => void;
    };
    __emeraldConsoleCaptureInstalled?: boolean;
  }
}

const levels: LogLevel[] = ['error', 'warn', 'log', 'info', 'debug', 'trace'];

function useConsoleCapture(onEntry: (e: LogEntry) => void) {
  const groupLevelRef = useRef(0);
  const installedRef = useRef(false);

  useEffect(() => {
    if (installedRef.current || window.__emeraldConsoleCaptureInstalled) return;
    installedRef.current = true;
    window.__emeraldConsoleCaptureInstalled = true;

    const orig: Partial<Record<LogLevel | 'dir' | 'table', (...a: any[]) => void>> = {};
    const capture = (level: LogLevel, args: any[]) => {
      const entry: LogEntry = {
        id: Date.now() + Math.random(),
        level,
        time: Date.now(),
        args,
        stack:
          level === 'error' || level === 'warn' || level === 'trace'
            ? new Error().stack
            : undefined,
        groupLevel: groupLevelRef.current,
      };
      onEntry(entry);
    };

    const wrap = (key: keyof typeof console, level: LogLevel) => {
      // @ts-ignore dynamic
      orig[level] = console[key].bind(console);
      // @ts-ignore dynamic
      console[key] = (...args: any[]) => {
        capture(level, args);
        // @ts-ignore dynamic
        orig[level]?.(...args);
        if (level === 'group' || level === 'groupCollapsed') groupLevelRef.current += 1;
        if (level === 'groupEnd') groupLevelRef.current = Math.max(0, groupLevelRef.current - 1);
      };
    };

    wrap('error', 'error');
    wrap('warn', 'warn');
    wrap('log', 'log');
    wrap('info', 'info');
    wrap('debug', 'debug');
    wrap('trace', 'trace');

    // Group APIs
    // @ts-ignore dynamic
    orig.group = console.group?.bind(console) ?? ((...a: any[]) => {});
    // @ts-ignore dynamic
    console.group = (...args: any[]) => {
      capture('group', args);
      // @ts-ignore dynamic
      orig.group?.(...args);
      groupLevelRef.current += 1;
    };
    // @ts-ignore dynamic
    orig.groupCollapsed = console.groupCollapsed?.bind(console) ?? ((...a: any[]) => {});
    // @ts-ignore dynamic
    console.groupCollapsed = (...args: any[]) => {
      capture('groupCollapsed', args);
      // @ts-ignore dynamic
      orig.groupCollapsed?.(...args);
      groupLevelRef.current += 1;
    };
    // @ts-ignore dynamic
    orig.groupEnd = console.groupEnd?.bind(console) ?? ((...a: any[]) => {});
    // @ts-ignore dynamic
    console.groupEnd = (...args: any[]) => {
      capture('groupEnd', args);
      groupLevelRef.current = Math.max(0, groupLevelRef.current - 1);
      // @ts-ignore dynamic
      orig.groupEnd?.(...args);
    };

    // Map dir/table to log-style entries
    // @ts-ignore dynamic
    orig.dir = console.dir?.bind(console) ?? ((...a: any[]) => {});
    // @ts-ignore dynamic
    console.dir = (...args: any[]) => {
      capture('log', ['[dir]', ...args]);
      // @ts-ignore dynamic
      orig.dir?.(...args);
    };
    // @ts-ignore dynamic
    orig.table = console.table?.bind(console) ?? ((...a: any[]) => {});
    // @ts-ignore dynamic
    console.table = (...args: any[]) => {
      capture('log', ['[table]', ...args]);
      // @ts-ignore dynamic
      orig.table?.(...args);
    };

    const onError = (ev: ErrorEvent) => {
      capture('error', [ev.message, ev.error ?? ev.filename ?? '']);
    };
    const onRejection = (ev: PromiseRejectionEvent) => {
      capture('error', ['UnhandledRejection', ev.reason]);
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, [onEntry]);
}

function safeFormat(arg: any): string {
  try {
    if (arg instanceof Error) {
      return `${arg.name}: ${arg.message}`;
    }
    if (typeof arg === 'string') return arg;
    if (typeof arg === 'function') return `[Function ${arg.name || 'anonymous'}]`;
    if (typeof arg === 'number' || typeof arg === 'boolean' || arg == null) return String(arg);
    const seen = new WeakSet();
    return JSON.stringify(arg, (_k, v) => {
      if (typeof v === 'object' && v !== null) {
        if (seen.has(v)) return '[Circular]';
        seen.add(v);
      }
      return v;
    }, 2);
  } catch {
    try {
      return String(arg);
    } catch {
      return '[Unserializable]';
    }
  }
}

function LevelBadge({ level }: { level: LogLevel }) {
  const color =
    level === 'error'
      ? 'bg-red-500/20 text-red-400 border-red-700/40'
      : level === 'warn'
      ? 'bg-yellow-500/20 text-yellow-400 border-yellow-700/40'
      : level === 'info'
      ? 'bg-sky-500/20 text-sky-400 border-sky-700/40'
      : level === 'debug'
      ? 'bg-purple-500/20 text-purple-400 border-purple-700/40'
      : level === 'trace'
      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-700/40'
      : level === 'group' || level === 'groupCollapsed'
      ? 'bg-zinc-500/20 text-zinc-300 border-zinc-700/40'
      : 'bg-zinc-500/20 text-zinc-300 border-zinc-700/40';
  return (
    <span className={cn('px-1.5 py-0.5 rounded border text-[10px] uppercase', color)}>{level}</span>
  );
}

export default function ConsolePanel() {
  const [open, setOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filter, setFilter] = useState('');
  const [levelOn, setLevelOn] = useState<Record<string, boolean>>({
    error: true,
    warn: true,
    log: true,
    info: true,
    debug: true,
    trace: true,
  });
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const viewportRef = useRef<HTMLDivElement>(null);

  const push = useCallback((e: LogEntry) => {
    if (paused) return;
    setEntries((prev) => [...prev, e].slice(-5000));
  }, [paused]);

  useConsoleCapture(push);

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.ctrlKey && ev.shiftKey && (ev.key === 'P' || ev.key === 'p')) {
        ev.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    window.__emeraldConsolePanel = {
      toggle: () => setOpen((v) => !v),
      open: () => setOpen(true),
      close: () => setOpen(false),
    };
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!autoScroll) return;
    const id = window.requestAnimationFrame(() => {
      const el = viewportRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
    return () => window.cancelAnimationFrame(id);
  }, [entries, autoScroll]);

  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase();
    return entries.filter((e) => {
      if (!levelOn[e.level]) return false;
      if (!f) return true;
      const s = e.args.map((a) => safeFormat(a)).join(' ');
      return s.toLowerCase().includes(f);
    });
  }, [entries, filter, levelOn]);

  if (!open) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-[999999] w-[36rem] max-w-[90vw] bg-background/95 backdrop-blur-xl border-l border-border/40 shadow-2xl flex flex-col">
      <div className="p-2 border-b border-border/40 flex items-center gap-2">
        <span className="text-sm font-semibold">Console</span>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter..."
          className="ml-2 flex-1 rounded bg-card/60 border border-border/40 px-2 py-1 text-sm outline-none"
        />
        <button
          className={cn('px-2 py-1 text-xs rounded border', paused ? 'bg-yellow-500/20 border-yellow-700/40' : 'bg-card/60 border-border/40')}
          onClick={() => setPaused((p) => !p)}
        >
          {paused ? 'Resume' : 'Pause'}
        </button>
        <button
          className="px-2 py-1 text-xs rounded border bg-card/60 border-border/40"
          onClick={() => setEntries([])}
        >
          Clear
        </button>
        <button
          className="px-2 py-1 text-xs rounded border bg-card/60 border-border/40"
          onClick={() => setAutoScroll((v) => !v)}
        >
          {autoScroll ? 'Auto' : 'Manual'}
        </button>
        <button
          className="px-2 py-1 text-xs rounded border bg-card/60 border-border/40"
          onClick={() => setOpen(false)}
        >
          Close
        </button>
      </div>
      <div className="px-2 py-1 flex items-center gap-2 border-b border-border/40">
        {levels.map((lvl) => (
          <label key={lvl} className="flex items-center gap-1 text-xs cursor-pointer select-none">
            <input
              type="checkbox"
              checked={!!levelOn[lvl]}
              onChange={(e) => setLevelOn((m) => ({ ...m, [lvl]: e.target.checked }))}
            />
            <LevelBadge level={lvl} />
          </label>
        ))}
      </div>
      <div ref={viewportRef} className="flex-1 overflow-auto p-2 space-y-1 text-xs">
        {filtered.map((e) => (
          <div key={e.id} className="font-mono">
            <div className="flex items-start gap-2">
              <LevelBadge level={e.level} />
              <span className="opacity-60 tabular-nums">{new Date(e.time).toLocaleTimeString()}</span>
              <div className="flex-1">
                <div style={{ paddingLeft: e.groupLevel * 12 }}>
                  {e.args.map((a, i) => (
                    <span key={i} className="whitespace-pre-wrap break-words">
                      {safeFormat(a)}{i < e.args.length - 1 ? ' ' : ''}
                    </span>
                  ))}
                </div>
                {e.stack && e.level !== 'group' && e.level !== 'groupCollapsed' && e.level !== 'groupEnd' ? (
                  <details className="opacity-60">
                    <summary>stack</summary>
                    <pre className="whitespace-pre-wrap break-words">{e.stack}</pre>
                  </details>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
