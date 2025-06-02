import { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import socketService from "../services/socketService";
import {
  setConnectionStatus,
  setConnecting,
  setConnectionError,
  setUserOnline,
  setUserOffline,
  addRealtimeMessage,
  setUserTyping,
  setUserStopTyping,
  markMessagesAsRead,
} from "../redux/chatSlice";

export const useSocket = () => {
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);
  const isInitialized = useRef(false);
  const connectionTimeout = useRef(null);

  useEffect(() => {
    if (user && token && !isInitialized.current) {
      console.log("Initializing socket connection for user:", user.name);
      dispatch(setConnecting(true));

      // Clear any existing timeout
      if (connectionTimeout.current) {
        clearTimeout(connectionTimeout.current);
      }

      // Set a timeout for connection
      connectionTimeout.current = setTimeout(() => {
        if (!socketService.isSocketConnected()) {
          dispatch(setConnectionError("Connection timeout"));
        }
      }, 10000);

      // Connect to socket
      try {
        socketService.connect(token);
        isInitialized.current = true;

        // Set up global event listeners
        const handleConnect = () => {
          console.log("Socket connected successfully");
          dispatch(setConnectionStatus(true));
          if (connectionTimeout.current) {
            clearTimeout(connectionTimeout.current);
          }
        };

        const handleDisconnect = (reason) => {
          console.log("Socket disconnected:", reason);
          dispatch(setConnectionStatus(false));
          // Only show connecting if it wasn't a manual disconnect
          if (reason !== "io client disconnect") {
            setTimeout(() => {
              if (!socketService.isSocketConnected()) {
                console.log("Attempting to reconnect...");
                dispatch(setConnecting(true));
              }
            }, 1000);
          }
        };

        const handleConnectError = (error) => {
          console.error("Socket connection error:", error);
          dispatch(setConnectionError(error.message || "Connection failed"));
          if (connectionTimeout.current) {
            clearTimeout(connectionTimeout.current);
          }
        };

        const handleReconnect = () => {
          console.log("Socket reconnected");
          dispatch(setConnectionStatus(true));
          dispatch(setConnectionError(null));
        };

        const handleReconnectAttempt = (attemptNumber) => {
          console.log(`Reconnection attempt ${attemptNumber}`);
          dispatch(setConnecting(true));
          dispatch(setConnectionError(null));
        };

        const handleReconnectFailed = () => {
          console.error("Socket reconnection failed");
          dispatch(setConnectionError("Failed to reconnect to chat server"));
          dispatch(setConnecting(false));
        };

        const handleUserOnline = (data) => {
          console.log("User came online:", data);
          dispatch(setUserOnline(data));
        };

        const handleUserOffline = (data) => {
          console.log("User went offline:", data);
          dispatch(setUserOffline(data));
        };

        const handleNewMessage = (data) => {
          console.log("New message received:", data);
          console.log("Message sender:", data.message.sender.name);
          console.log("Conversation ID:", data.conversationId);
          console.log("Current page:", window.location.pathname);

          dispatch(addRealtimeMessage(data));

          // Show browser notification if supported and permission granted
          if ("Notification" in window && Notification.permission === "granted") {
            const notification = new Notification("New Message", {
              body: `${data.message.sender.name}: ${data.message.content}`,
              icon: "/favicon.ico",
              tag: data.conversationId,
              silent: false,
            });

            // Auto-close notification after 5 seconds
            setTimeout(() => notification.close(), 5000);

            console.log("Browser notification shown for message from:", data.message.sender.name);
          } else {
            console.log("Browser notifications not available or not permitted");
          }
        };

        const handleUserTyping = (data) => {
          dispatch(setUserTyping(data));
        };

        const handleUserStopTyping = (data) => {
          dispatch(setUserStopTyping(data));
        };

        const handleMessagesRead = (data) => {
          dispatch(markMessagesAsRead(data));
        };

        // Get socket instance and set up listeners
        const socket = socketService.getSocket();
        if (socket) {
          socket.on("connect", handleConnect);
          socket.on("disconnect", handleDisconnect);
          socket.on("connect_error", handleConnectError);
          socket.on("reconnect", handleReconnect);
          socket.on("reconnect_attempt", handleReconnectAttempt);
          socket.on("reconnect_failed", handleReconnectFailed);

          socketService.onUserOnline(handleUserOnline);
          socketService.onUserOffline(handleUserOffline);
          socketService.onNewMessage(handleNewMessage);
          socketService.onUserTyping(handleUserTyping);
          socketService.onUserStopTyping(handleUserStopTyping);
          socketService.onMessagesRead(handleMessagesRead);

          // Request notification permission
          if ("Notification" in window) {
            console.log("Current notification permission:", Notification.permission);

            if (Notification.permission === "default") {
              console.log("Requesting notification permission...");
              Notification.requestPermission().then((permission) => {
                console.log("Notification permission result:", permission);
                if (permission === "granted") {
                  console.log("✅ Browser notifications enabled");
                } else {
                  console.log("❌ Browser notifications denied");
                }
              });
            } else if (Notification.permission === "granted") {
              console.log("✅ Browser notifications already enabled");
            } else {
              console.log("❌ Browser notifications are blocked");
            }
          } else {
            console.log("❌ Browser notifications not supported");
          }

          // Check if already connected
          if (socket.connected) {
            handleConnect();
          }
        }

        return () => {
          console.log("Cleaning up socket listeners...");
          if (connectionTimeout.current) {
            clearTimeout(connectionTimeout.current);
          }
          if (socket) {
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("connect_error", handleConnectError);
            socket.off("reconnect", handleReconnect);
            socket.off("reconnect_attempt", handleReconnectAttempt);
            socket.off("reconnect_failed", handleReconnectFailed);

            socketService.off("user_online", handleUserOnline);
            socketService.off("user_offline", handleUserOffline);
            socketService.off("new_message", handleNewMessage);
            socketService.off("user_typing", handleUserTyping);
            socketService.off("user_stop_typing", handleUserStopTyping);
            socketService.off("messages_read", handleMessagesRead);
          }
        };
      } catch (error) {
        console.error("Failed to initialize socket:", error);
        dispatch(setConnectionError(error.message || "Failed to initialize connection"));
        if (connectionTimeout.current) {
          clearTimeout(connectionTimeout.current);
        }
      }
    }

    return () => {
      if (isInitialized.current) {
        console.log("Disconnecting socket on cleanup...");
        if (connectionTimeout.current) {
          clearTimeout(connectionTimeout.current);
        }
        socketService.disconnect();
        isInitialized.current = false;
        dispatch(setConnectionStatus(false));
        dispatch(setConnecting(false));
      }
    };
  }, [user, token, dispatch]);

  return socketService;
};
