import { useCallback, useEffect, useRef, useState } from "react";
import { fetchNotifications } from "../services/notifications.service.js";

export const NOTIFICATION_STATUS = Object.freeze({
  IDLE: "idle",
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
  RETRYING: "retrying",
});

const RETRY_DELAYS = [5000, 10000, 20000];
const RECOVERY_INTERVAL_MS = 60000;
const VISIBILITY_REFRESH_AFTER_MS = 15000;

export function isEmptySuccessfulNotifications(state) {
  return state.status === NOTIFICATION_STATUS.SUCCESS && state.total === 0 && state.items.length === 0;
}

const initialState = () => ({
  status: NOTIFICATION_STATUS.IDLE,
  items: [],
  total: 0,
  lastSuccessfulItems: [],
  lastSuccessfulTotal: 0,
  error: null,
  lastUpdatedAt: null,
});

/** A single-flight notification cycle resilient to StrictMode, recovery and tab changes. */
export default function useNotifications({ enabled, userId }) {
  const [state, setState] = useState(initialState);
  const cycleRef = useRef(null);

  useEffect(() => {
    if (!enabled || !userId) {
      setState(initialState());
      return undefined;
    }

    const cycle = { active: true, inFlight: false, controller: null, timer: null, failures: 0, lastAttemptAt: 0, request: null };
    cycleRef.current = cycle;

    const clearTimer = () => {
      if (cycle.timer) window.clearTimeout(cycle.timer);
      cycle.timer = null;
    };
    const schedule = (delay, mode) => {
      if (!cycle.active) return;
      clearTimer();
      cycle.timer = window.setTimeout(() => cycle.request(mode), delay);
    };

    cycle.request = async (mode = "initial") => {
      if (!cycle.active || cycle.inFlight) return;
      clearTimer();
      cycle.inFlight = true;
      cycle.lastAttemptAt = Date.now();
      const controller = new AbortController();
      cycle.controller = controller;
      const isRetry = mode === "retry" || cycle.failures > 0;
      setState((current) => ({ ...current, status: isRetry ? NOTIFICATION_STATUS.RETRYING : NOTIFICATION_STATUS.LOADING, error: null }));

      let nextDelay = null;
      try {
        const payload = await fetchNotifications({ signal: controller.signal });
        if (!cycle.active || cycle.controller !== controller) return;
        cycle.failures = 0;
        setState({
          status: NOTIFICATION_STATUS.SUCCESS,
          items: payload.items,
          total: payload.total,
          lastSuccessfulItems: payload.items,
          lastSuccessfulTotal: payload.total,
          error: null,
          lastUpdatedAt: Date.now(),
        });
        nextDelay = RECOVERY_INTERVAL_MS;
      } catch (error) {
        if (!cycle.active || controller.signal.aborted || error?.code === "ABORTED") return;
        cycle.failures += 1;
        setState((current) => ({ ...current, status: NOTIFICATION_STATUS.ERROR, error }));
        nextDelay = RETRY_DELAYS[cycle.failures - 1] ?? RECOVERY_INTERVAL_MS;
      } finally {
        if (cycle.controller === controller) cycle.controller = null;
        cycle.inFlight = false;
        if (cycle.active && nextDelay !== null) schedule(nextDelay, nextDelay === RECOVERY_INTERVAL_MS && cycle.failures === 0 ? "poll" : "retry");
      }
    };

    const retryNow = () => cycle.request("retry");
    const handleOnline = () => retryNow();
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && Date.now() - cycle.lastAttemptAt >= VISIBILITY_REFRESH_AFTER_MS) retryNow();
    };
    const handleOffline = () => {
      if (!cycle.active || cycle.inFlight) return;
      setState((current) => ({ ...current, status: NOTIFICATION_STATUS.ERROR, error: new Error("Sin conexión") }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    document.addEventListener("visibilitychange", handleVisibility);
    cycle.request("initial");

    return () => {
      cycle.active = false;
      clearTimer();
      cycle.controller?.abort();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (cycleRef.current === cycle) cycleRef.current = null;
    };
  }, [enabled, userId]);

  const retry = useCallback(() => cycleRef.current?.request?.("retry"), []);
  return { ...state, retry, isEmptySuccessful: isEmptySuccessfulNotifications(state) };
}
