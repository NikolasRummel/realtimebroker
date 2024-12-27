import { EventEmitter } from 'events';

// Define the PubSubMessage type
export type PubSubMessage = {
    topic: string;
    message: string;
    timestamp: Date;
};

class PubSubClient extends EventEmitter {
    static instance: PubSubClient | null = null;
    ws: WebSocket | null = null;
    serverUrl: string;
    connected: boolean = false;
    subscribedTopics: Set<string> = new Set();
    subscriptionQueue: string[] = []; // Queue for topics to subscribe to while connecting

    private constructor(serverUrl: string) {
        super();
        this.serverUrl = serverUrl;
    }

    static getInstance(): PubSubClient {
        if (!PubSubClient.instance) {
            PubSubClient.instance = new PubSubClient("ws://localhost:50053");
        }
        return PubSubClient.instance;
    }

    async connect() {
        if (this.ws && this.connected) {
            return;
        }

        return new Promise<void>((resolve, reject) => {
            this.ws = new WebSocket(this.serverUrl);

            this.ws.onopen = () => {
                this.connected = true;
                console.log("WebSocket connected");

                // Process queued subscriptions
                this.subscriptionQueue.forEach((topic) => this.subscribe(topic));
                this.subscriptionQueue = []; // Clear the queue
                resolve();
            };

            this.ws.onmessage = (event) => {
                const parsedMessage: PubSubMessage = JSON.parse(event.data);
                const { topic, message } = parsedMessage;
                const pubSubMessage: PubSubMessage = {
                    topic,
                    message,
                    timestamp: new Date(),
                }

                this.emit(topic, pubSubMessage); // Broadcast to all listeners
            };

            this.ws.onerror = (error) => {
                console.error("WebSocket error:", error);
                reject(error);
            };

            this.ws.onclose = () => {
                console.log("WebSocket closed");
                this.connected = false;
            };
        });
    }

    isConnected() {
        return this.connected;
    }

    isSubscribed(topic: string) {
        return this.subscribedTopics.has(topic);
    }

    subscribe(topic: string) {
        if (this.isSubscribed(topic)) {
            console.log(`Already subscribed to topic: ${topic}`);
            return;
        }

        if (!this.connected) {
            console.warn("WebSocket not connected. Queuing subscription.");
            this.subscriptionQueue.push(topic);
            return;
        }

        if(this.ws?.readyState === WebSocket.OPEN) {
            this.ws?.send(
                JSON.stringify({
                    command: "SUBSCRIBE",
                    topic,
                })
            );

            this.subscribedTopics.add(topic);
            console.log(`Subscribed to topic: ${topic}`);
        }
    }
}

export default PubSubClient;