"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { usePathname } from "next/navigation";

const ALLOWED_ROUTES = ["/"];

const PromptContext = createContext(null);

export function useInstallPrompt() {
  const context = useContext(PromptContext);
  if (context === null) {
    throw new Error("useInstallPrompt must be used within a PromptProvider");
  }
  return context;
}

export function PromptProvider({ children }) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  const pathname = usePathname();

  // Effect to listen for the browser's native install prompt event
  useEffect(() => {
    // Check if the user is on an iOS device
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  // Effect to decide whether to show the prompt based on route, dismissal state, and prompt availability
  useEffect(() => {
    const isAllowed = ALLOWED_ROUTES.some((route) => pathname === route);
    const canShow = (isIOS || deferredPrompt) && isAllowed && !isDismissed;
    setShowPrompt(canShow);
  }, [pathname, isDismissed, deferredPrompt, isIOS]);

  const dismiss = useCallback(() => {
    setIsDismissed(true);
  }, []);

  const trigger = useCallback(() => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      // The prompt can only be used once.
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const value = {
    showInstallPrompt: showPrompt,
    dismissInstallPrompt: dismiss,
    triggerInstallPrompt: trigger,
    isIOS,
  };

  return (
    <PromptContext.Provider value={value}>{children}</PromptContext.Provider>
  );
}
