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

export const WebSocketService: WebSocketService = {
    wss: null,

    startServer() {
        this.wss = new WebSocket.Server({ port: CONFIG.wsPort });

        this.wss.on('connection', (ws: WebSocket) => {
            console.log('A new client connected');

            ws.on('message', (message: WebSocket.Data) => this.handleMessage(ws, message));

            ws.on('close', () => this.handleClose());

            ws.on('error', (error: Error) => this.handleError(error));
        });

        console.log(chalk.cyan(`WebSocket server is running on http://localhost:${CONFIG.wsPort}`));
    },

    handleMessage(ws: WebSocket, message: WebSocket.Data) {
        console.log('Received WS message:', message.toString());

        try {
            const parsedMessage = JSON.parse(message.toString());

            const { command, topic, msg }: { command: string, topic: string, msg?: string } = parsedMessage;

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

    handleSubscribe(ws: WebSocket, topic: string) {
        handleWsSubscription(ws, topic);
    },

    handlePublish(topic: string, msg: string) {
        if (msg) {
            console.log(`Publishing message: "${msg}" to topic: ${topic}`);
            onPublish(topic, msg); // Handle publishing logic
        } else {
            console.error('No message provided for PUBLISH');
        }
    },

    handleClose() {
        console.log('A client disconnected');
    },

    // Handle WebSocket errors
    handleError(error: Error) {
        console.error('WebSocket error:', error);
    }
};
