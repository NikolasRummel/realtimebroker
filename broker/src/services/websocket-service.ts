import WebSocket from 'ws';
import { handleWsSubscription, onPublish } from './pubsub';
import { CONFIG } from '../config';
import chalk from "chalk"; // Import configuration

// Define the shape of the WebSocketService
interface WebSocketService {
    wss: WebSocket.Server | null;

    startServer(): void;

    handleMessage(ws: WebSocket, message: WebSocket.Data): void;

    handleSubscribe(ws: WebSocket, topic: string): void;

    handlePublish(topic: string, msg: string): void;

    handleClose(): void;

    handleError(error: Error): void;
}

// Create the WebSocketService constant and type it
export const WebSocketService: WebSocketService = {
    wss: null,

    // Initialize WebSocket server
    startServer() {
        this.wss = new WebSocket.Server({ port: CONFIG.wsPort });

        // Set up event listeners
        this.wss.on('connection', (ws: WebSocket) => {
            console.log('A new client connected');

            // Handle incoming messages from the client
            ws.on('message', (message: WebSocket.Data) => this.handleMessage(ws, message));

            // Handle client disconnections
            ws.on('close', () => this.handleClose());

            // Handle WebSocket errors
            ws.on('error', (error: Error) => this.handleError(error));
        });

        console.log(chalk.cyan(`WebSocket server is running on http://localhost:${CONFIG.wsPort}`));
    },

    // Handle incoming messages from the client
    handleMessage(ws: WebSocket, message: WebSocket.Data) {
        console.log('Received message:', message.toString());

        try {
            // Parse the incoming JSON message
            const parsedMessage = JSON.parse(message.toString());

            // Extract command, topic, and message content
            const { command, topic, msg }: { command: string, topic: string, msg?: string } = parsedMessage;

            // Process commands
            if (command === 'SUBSCRIBE') {
                this.handleSubscribe(ws, topic);
            } else if (command === 'PUBLISH') {
                this.handlePublish(topic, msg || '');
            } else {
                console.error(`Invalid command: ${command}`);
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    },

    // Handle subscription logic
    handleSubscribe(ws: WebSocket, topic: string) {
        handleWsSubscription(ws, topic);
    },

    // Handle publish logic
    handlePublish(topic: string, msg: string) {
        if (msg) {
            console.log(`Publishing message: "${msg}" to topic: ${topic}`);
            onPublish(topic, msg); // Handle publishing logic
        } else {
            console.error('No message provided for PUBLISH');
        }
    },

    // Handle WebSocket disconnections
    handleClose() {
        console.log('A client disconnected');
    },

    // Handle WebSocket errors
    handleError(error: Error) {
        console.error('WebSocket error:', error);
    }
};
