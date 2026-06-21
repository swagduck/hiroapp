import PusherClient from "pusher-js";

export const pusherClient = new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_KEY || "f8997d3cc67f9777fbcc",
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap1",
  }
);
