import { useEffect } from "react";
import axios from "axios";
import { API_URL } from "../config/api";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const usePushNotifications = (user) => {
  useEffect(() => {
    if (!user || !user.token) return;

    const setupPushNotifications = async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        return; // Not supported
      }

      try {
        // Register SW if not already registered
        const registration = await navigator.serviceWorker.register("/sw.js");

        // Ask for permission if not granted
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        // Check for existing subscription
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          // You MUST replace the VAPID_PUBLIC_KEY with the one generated
          const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || "BOtU4nvWs-IcxhIo2doLpBceMNEa5m6sAhWrXYAh4vZ9IrXOBkL03YlGPEosc27kBD2dxDk47Pn0RrxKiuAVS10"; // Hardcoded fallback for convenience
          
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
          });
        }

        // Send to backend
        await axios.post(
          `${API_URL}/api/users/push-subscription`,
          {
            subscription: subscription.toJSON(),
            userAgent: navigator.userAgent
          },
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
        console.log("Push subscription synced with backend");

      } catch (error) {
        console.error("Failed to setup push notifications:", error);
      }
    };

    setupPushNotifications();
  }, [user]);
};

export default usePushNotifications;
