import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

let stompClient = null;
const subscribers = new Map();

export const connectWebSocket = (userId, onMessageReceived) => {
    if (stompClient && stompClient.connected) {
        subscribeToUser(userId, onMessageReceived);
        return;
    }

    const socket = new SockJS('http://localhost:8080/ws');
    stompClient = Stomp.over(socket);
    // Disable debug logging to keep console clean
    stompClient.debug = null;

    stompClient.connect({}, (frame) => {
        console.log('Connected to WebSocket: ' + frame);
        subscribeToUser(userId, onMessageReceived);
    }, (error) => {
        console.error('WebSocket connection error:', error);
        // Retry connection after 5 seconds
        setTimeout(() => connectWebSocket(userId, onMessageReceived), 5000);
    });
};

const subscribeToUser = (userId, onMessageReceived) => {
    const topic = `/user/${userId}/queue/notifications`;
    
    // Unsubscribe existing if any
    if (subscribers.has(topic)) {
        subscribers.get(topic).unsubscribe();
    }

    const subscription = stompClient.subscribe(topic, (message) => {
        if (message.body) {
            const notification = JSON.parse(message.body);
            onMessageReceived(notification);
        }
    });

    subscribers.set(topic, subscription);
};

export const disconnectWebSocket = () => {
    if (stompClient !== null) {
        stompClient.disconnect();
        console.log('Disconnected from WebSocket');
    }
    subscribers.clear();
};
