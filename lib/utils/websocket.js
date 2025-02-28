import { io } from "socket.io-client"

let socket

export const initializeSocket = () => {
  socket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL, {
    transports: ["websocket"],
  })

  socket.on("connect", () => {
    console.log("Connected to WebSocket server")
  })

  socket.on("disconnect", () => {
    console.log("Disconnected from WebSocket server")
  })

  return socket
}

export const getSocket = () => {
  if (!socket) {
    throw new Error("Socket not initialized. Call initializeSocket first.")
  }
  return socket
}