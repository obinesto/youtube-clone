"use client";

import { useState, useEffect } from "react";
import { useInstallPrompt } from "@/components/PromptProvider";
import {
  subscribeUser,
  unsubscribeUser,
  sendTestNotificationToUser,
} from "./actions";
import useUserStore from "@/hooks/useStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, BellOff, Plus, Share, Smartphone, X } from "lucide-react";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function InstallPrompt() {
  const {
    showInstallPrompt,
    dismissInstallPrompt,
    triggerInstallPrompt,
    isIOS,
  } = useInstallPrompt();

  if (!showInstallPrompt) return null;

  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <Smartphone className="h-5 w-5" />
        <h3 className="text-lg font-semibold w-full justify-between">
          Install YouTube Clone App
        </h3>
        <Button onClick={dismissInstallPrompt}>
          <X />
        </Button>
      </div>
      {isIOS ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            To install this app on your iOS device:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>
              Tap the <Share className="h-4 w-4 inline mx-1" /> share button
            </li>
            <li>
              Scroll down and tap &quot;Add to Home Screen&quot;{" "}
              <Plus className="h-4 w-4 inline mx-1" />
            </li>
            <li>Tap &quot;Add&quot; to confirm</li>
          </ol>
        </div>
      ) : (
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            Install our app for a better experience with offline access and
            faster loading times.
          </p>
          <Button onClick={triggerInstallPrompt}>
            <Plus className="h-4 w-4 mr-2" />
            Add to Home Screen
          </Button>
        </div>
      )}
    </Card>
  );
}

function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [subscriptionVisibility, setSubscriptionVisibility] = useState(true);
  const [message, setMessage] = useState("");
  const [loadingStates, setLoadingStates] = useState({
    subscribe: false,
    unsubscribe: false,
    test: false,
  });
  const { user } = useUserStore();

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      navigator.serviceWorker.ready.then(async (registration) => {
        const sub = await registration.pushManager.getSubscription();
        setSubscription(sub);
      }).catch(error => {
        console.error("Error getting service worker ready:", error);
      });
    }
  }, []);

  async function subscribeToPush() {
    setLoadingStates(prev => ({ ...prev, subscribe: true }));
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        ),
      });
      setSubscription(sub);

      if (!user?.uid) {
        console.error("Firebase UID is missing. Subscription cannot be saved.");
        await sub.unsubscribe();
        setSubscription(null);
        return;
      }

      await subscribeUser(sub.toJSON(), user?.uid);
    } catch (error) {
    } finally {
      setLoadingStates(prev => ({ ...prev, subscribe: false }));
    }
  }

  async function unsubscribeFromPush() {
    setLoadingStates(prev => ({ ...prev, unsubscribe: true }));
    try {
      await subscription?.unsubscribe();
      await unsubscribeUser(subscription.toJSON());
      setSubscription(null);
      setSubscriptionVisibility(false);
    } catch (error) {
      console.error("Failed to unsubscribe:", error);
    } finally {
      setLoadingStates(prev => ({ ...prev, unsubscribe: false }));
    }
  }

  async function sendTestNotification() {
    if (!subscription || !message.trim()) return;
    setLoadingStates(prev => ({ ...prev, test: true }));
    try {
      await sendTestNotificationToUser(subscription.toJSON(), message);
      setMessage("");
    } catch (error) {
      console.error("Failed to send notification:", error);
    } finally {
      setLoadingStates(prev => ({ ...prev, test: false }));
    }
  }

  // Hide the component if the user has dismissed it or if user device does not support push notifications or if there is no user
  if (!subscriptionVisibility || !isSupported || !user) {
    return null;
  }

  return (
    <Card className="flex flex-col p-2 mb-6">
      {subscription ? (
        <>
          <p className="text-sm text-muted-foreground mb-2">
            You&apos;ll receive notifications about videoa you&apos;ve
            interacted with.
          </p>
          <div className="flex flex-col gap-4">
            <div className="flex gap-3">
              <Input
                type="text"
                placeholder="Enter a test notification message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={sendTestNotification}
                disabled={loadingStates.test || !message.trim()}
              >
                {loadingStates.test ? "Testing..." : "Test"}
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="destructive"
                onClick={unsubscribeFromPush}
                disabled={loadingStates.unsubscribe}
              >
                <BellOff className="h-4 w-4 mr-2" />
                {loadingStates.unsubscribe ? "Disabling..." : "Disable Notifications"}
              </Button>
              <Button
                onClick={() => setSubscriptionVisibility(false)}
                disabled={Object.values(loadingStates).some(Boolean)}
              >
                <X />
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col md:flex-row items-center gap-4">
          <p className="text-sm text-muted-foreground">
            Enable notifications to stay updated with acvities on here.
          </p>
          <div className="w-full md:w-1/4 flex justify-between md:justify-start gap-4 items-center">
            <Button onClick={subscribeToPush} disabled={loadingStates.subscribe || !user?.uid}>
              <Bell />
              {loadingStates.subscribe ? "Enabling..." : "Enable Notifications"}
            </Button>
            <Button
              onClick={() => setSubscriptionVisibility(false)}
              disabled={Object.values(loadingStates).some(Boolean)}
            >
              <X />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function PwaSetup() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);
  if (!isClient) return null;

  return (
    <div className="fixed top-10 left-0 md:left-32 right-0 flex flex-col max-w-2xl mx-auto px-4 py-8">
      <PushNotificationManager />
      <InstallPrompt />
    </div>
  );
}
