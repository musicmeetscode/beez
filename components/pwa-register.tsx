"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    if (!window.location.protocol.startsWith("http")) {
      return;
    }

    const registerSW = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === "installed") {
                  if (navigator.serviceWorker.controller) {
                    console.info("New Beez version ready.");
                  } else {
                    console.info("Beez is cached for offline use.");
                  }
                }
              };
            }
          };
        })
        .catch((err) => {
          console.warn("Beez Service Worker registration failed:", err);
        });
    };

    if (document.readyState === "complete") {
      registerSW();
    } else {
      window.addEventListener("load", registerSW);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Stash install prompt event
      Object.assign(window, { deferredPrompt: e });
      window.dispatchEvent(new CustomEvent("pwa-installable"));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("load", registerSW);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  return null;
}

