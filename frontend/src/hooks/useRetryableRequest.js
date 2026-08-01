import { useCallback, useEffect, useRef, useState } from "react";

const RETRY_DELAYS = [5000, 8000, 10000];
const MAX_WINDOW_MS = 40000;
const SLOW_LOAD_MS = 10000;

export function isTemporaryRequestError(error) {
  return error?.code === "NETWORK_ERROR" || [500, 502, 503].includes(error?.status);
}

export default function useRetryableRequest(request, [requestKey] = [], options = {}) {
  const { enabled = true, maxWindowMs = MAX_WINDOW_MS, retryDelays = RETRY_DELAYS } = options;
  const requestRef = useRef(request);
  const runRef = useRef(null);
  const mountedRef = useRef(false);
  const [state, setState] = useState({ data: null, loading: Boolean(enabled), isRetrying: false, slow: false, error: null, attempt: 0 });
  requestRef.current = request;

  const cancel = useCallback(() => {
    const run = runRef.current;
    if (!run) return;
    run.cancelled = true;
    run.controller?.abort();
    window.clearTimeout(run.retryTimer);
    window.clearTimeout(run.slowTimer);
    window.clearTimeout(run.deadlineTimer);
    runRef.current = null;
  }, []);

  const start = useCallback(() => {
    cancel();
    if (!enabled) {
      if (mountedRef.current) setState((current) => ({ ...current, loading: false, isRetrying: false }));
      return;
    }
    const run = { cancelled: false, startedAt: Date.now(), attempt: 0, controller: null, retryTimer: null, slowTimer: null, deadlineTimer: null };
    runRef.current = run;
    if (mountedRef.current) setState((current) => ({ ...current, loading: true, isRetrying: false, slow: false, error: null, attempt: 0 }));
    run.slowTimer = window.setTimeout(() => {
      if (!run.cancelled && mountedRef.current) setState((current) => ({ ...current, slow: true }));
    }, SLOW_LOAD_MS);
    run.deadlineTimer = window.setTimeout(() => {
      if (run.cancelled || runRef.current !== run) return;
      run.cancelled = true;
      window.clearTimeout(run.retryTimer);
      window.clearTimeout(run.slowTimer);
      run.controller?.abort();
      runRef.current = null;
      if (mountedRef.current) {
        const error = new Error("El servicio continúa sin responder. Revisa tu conexión e inténtalo nuevamente.");
        error.code = "NETWORK_ERROR";
        error.isNetworkError = true;
        setState((current) => ({ ...current, loading: false, isRetrying: false, slow: false, error }));
      }
    }, maxWindowMs);

    const attemptRequest = async () => {
      if (run.cancelled || runRef.current !== run) return;
      run.attempt += 1;
      run.controller = new AbortController();
      if (mountedRef.current) setState((current) => ({ ...current, loading: true, isRetrying: run.attempt > 1, attempt: run.attempt }));
      try {
        const data = await requestRef.current({ signal: run.controller.signal, attempt: run.attempt });
        if (run.cancelled || runRef.current !== run || !mountedRef.current) return;
        window.clearTimeout(run.slowTimer);
        window.clearTimeout(run.deadlineTimer);
        runRef.current = null;
        setState({ data, loading: false, isRetrying: false, slow: false, error: null, attempt: run.attempt });
      } catch (error) {
        if (run.cancelled || runRef.current !== run || error?.code === "ABORTED") return;
        const elapsed = Date.now() - run.startedAt;
        const delay = retryDelays[Math.min(run.attempt - 1, retryDelays.length - 1)] ?? 10000;
        if (isTemporaryRequestError(error) && elapsed + delay < maxWindowMs) {
          if (mountedRef.current) setState((current) => ({ ...current, loading: true, isRetrying: true, error: null, attempt: run.attempt }));
          run.retryTimer = window.setTimeout(attemptRequest, delay);
          return;
        }
        if (!mountedRef.current) return;
        window.clearTimeout(run.slowTimer);
        window.clearTimeout(run.deadlineTimer);
        runRef.current = null;
        setState((current) => ({ ...current, loading: false, isRetrying: false, slow: false, error, attempt: run.attempt }));
      }
    };
    attemptRequest();
  }, [cancel, enabled, maxWindowMs, retryDelays]);

  useEffect(() => {
    mountedRef.current = true;
    start();
    return () => { mountedRef.current = false; cancel(); };
  }, [start, cancel, requestKey]);

  return { ...state, retry: start, cancel };
}
