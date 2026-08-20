"use client";

import * as React from "react";

/**
 * Registers the service worker that makes Kaa installable and lets the shell
 * open offline. Registration is deferred to the load event so it never competes
 * with first paint on a slow Tanzanian connection.
 */
export function RegisterServiceWorker() {
  React.useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error) => {
        console.warn("[kaa] service worker registration failed", error);
      });
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
