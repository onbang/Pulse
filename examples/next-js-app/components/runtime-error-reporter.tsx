"use client";

import { useEffect } from "react";

type ClientRuntimeErrorPayload = {
  type: "window.error" | "window.unhandledrejection";
  message: string;
  stack?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  href: string;
  userAgent: string;
};

const reportedErrors = new Set<string>();
const MAX_REPORTED_ERRORS = 50;

function makeFingerprint(payload: ClientRuntimeErrorPayload) {
  return [
    payload.type,
    payload.message,
    payload.filename ?? "",
    payload.lineno ?? 0,
    payload.colno ?? 0,
  ].join("|");
}

function sendRuntimeError(payload: ClientRuntimeErrorPayload) {
  const body = JSON.stringify(payload);

  if (
    typeof navigator !== "undefined" &&
    typeof navigator.sendBeacon === "function"
  ) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/debug/runtime-logs", blob);
    return;
  }

  void fetch("/api/debug/runtime-logs", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body,
    keepalive: true,
  }).catch(() => {
    // Intentionally ignore client-side logging failures.
  });
}

export function RuntimeErrorReporter() {
  useEffect(() => {
    const handleWindowError = (event: ErrorEvent) => {
      const payload: ClientRuntimeErrorPayload = {
        type: "window.error",
        message: event.message || "Unknown client error",
        stack: event.error instanceof Error ? event.error.stack : undefined,
        filename: event.filename || undefined,
        lineno: event.lineno || undefined,
        colno: event.colno || undefined,
        href: window.location.href,
        userAgent: navigator.userAgent,
      };

      const fingerprint = makeFingerprint(payload);

      if (reportedErrors.has(fingerprint)) {
        return;
      }

      if (reportedErrors.size >= MAX_REPORTED_ERRORS) {
        reportedErrors.clear();
      }

      reportedErrors.add(fingerprint);
      sendRuntimeError(payload);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason =
        event.reason instanceof Error
          ? {
              message: event.reason.message,
              stack: event.reason.stack,
            }
          : {
              message:
                typeof event.reason === "string"
                  ? event.reason
                  : "Unhandled promise rejection",
              stack: undefined,
            };

      const payload: ClientRuntimeErrorPayload = {
        type: "window.unhandledrejection",
        message: reason.message,
        stack: reason.stack,
        href: window.location.href,
        userAgent: navigator.userAgent,
      };

      const fingerprint = makeFingerprint(payload);

      if (reportedErrors.has(fingerprint)) {
        return;
      }

      if (reportedErrors.size >= MAX_REPORTED_ERRORS) {
        reportedErrors.clear();
      }

      reportedErrors.add(fingerprint);
      sendRuntimeError(payload);
    };

    window.addEventListener("error", handleWindowError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleWindowError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
    };
  }, []);

  return null;
}
