// Yappo Service Worker — handles notification display on mobile
// This file runs in a separate thread and enables notifications on Android/iOS

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.matchAll({ type: "window" }).then(() => {}));
});

// Handle incoming push messages
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();
    
    // Default options
    const options = {
      body: data.message,
      icon: data.avatar || "/logo.png",
      badge: "/logo.png", // A small monochrome icon used by Android
      tag: data.chatId, // Deduplication tag
      data: {
        chatId: data.chatId
      }
    };

    // Check if app is focused and viewing the same chat to suppress notification
    event.waitUntil(
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
        let isFocusedAndViewingChat = false;
        
        for (const client of clientList) {
          if (client.focused && (client.url.includes(`/dashboard?chat=${data.chatId}`) || client.url.includes('/dashboard'))) {
             // Let's not suppress it unless we are 100% sure we're exactly on that chat.
             // Actually, for simplicity, since it's hard to read exact React router state from SW,
             // we'll rely on the backend checking socket connection. But if we want to be safe:
             // isFocusedAndViewingChat = true;
          }
        }

        if (!isFocusedAndViewingChat) {
          return self.registration.showNotification(data.senderName, options);
        }
      })
    );
  }
});

// Handle notification click — focus or open the app directly to the chat
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const chatId = event.notification.data?.chatId;
  const targetUrl = chatId ? `/dashboard?chat=${chatId}` : "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and maybe postMessage to navigate
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
