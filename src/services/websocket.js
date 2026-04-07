import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

let client = null;

/**
 * Connects to the WebSocket server using SockJS and STOMP.
 * @param {string|number} userId - The unique ID of the user for the private queue.
 * @param {function} onMessageReceived - Callback function to handle incoming notifications.
 */
export const connectWebSocket = (userId, onMessageReceived) => {
  // Prevent duplicate connections
  if (client && client.active) {
    return;
  }

  // Create STOMP client with modern @stomp/stompjs Client API
  client = new Client({
    webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
    debug: (msg) => console.log('STOMP:', msg),
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
  });

  client.onConnect = (frame) => {
    console.log('Successfully connected to /ws');
    
    // Subscribe to the private user-specific notification queue
    client.subscribe(`/user/${userId}/queue/notifications`, (message) => {
      if (message.body) {
        try {
          const notification = JSON.parse(message.body);
          onMessageReceived(notification);
        } catch (err) {
          console.error('Failed to parse notification JSON:', err);
        }
      }
    });
  };

  client.onStompError = (frame) => {
    console.error('Broker reported error:', frame.headers['message']);
    console.error('Additional details:', frame.body);
  };

  client.activate();
};

/**
 * Gracefully disconnects the STOMP client.
 */
export const disconnectWebSocket = () => {
  if (client) {
    client.deactivate();
    console.log('WebSocket service deactivated.');
  }
};
