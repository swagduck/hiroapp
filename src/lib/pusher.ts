import Pusher from "pusher";

// Note: Replace these with real keys from Pusher Dashboard
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID || "2169123",
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || "f8997d3cc67f9777fbcc",
  secret: process.env.PUSHER_SECRET || "241b4a8127de52da3bd7",
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap1",
  useTLS: true,
});
