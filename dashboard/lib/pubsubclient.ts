import { EventEmitter } from 'events';

class PubSubClient extends EventEmitter {
    static instance: PubSubClient | null = null;
    ws: WebSocket | null = null;
    serverUrl: string;
    connected: boolean = false;  // Track the connection status

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

    // Establish WebSocket connection to the server
    async connect() {
        if (this.ws) {
            console.log('Already connected to WebSocket server.');
            return;
        }

        return new Promise<void>((resolve, reject) => {
            this.ws = new WebSocket(this.serverUrl);

            this.ws.onopen = () => {
                this.connected = true;  // Mark as connected
                console.log('Connected to WebSocket server');
                resolve();
            };

            this.ws.onmessage = (event) => {
                // Log incoming message for debugging
                console.log('Message received:', event.data);

                try {
                    const parsedMessage = JSON.parse(event.data);
                    console.log('Parsed Message:', parsedMessage);

                    const { topic, message } = parsedMessage;  // Using 'message' from the backend
                    alert("New message: " + message); // Trigger the alert on new message

                    this.emit(topic, message);
                } catch (error) {
                    console.error('Failed to parse message:', error);
                }
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                reject(error);
            };

            this.ws.onclose = () => {
                console.log('WebSocket connection closed');
                this.connected = false; // Mark as disconnected
            };
        });
    }

    // Subscribe to a specific topic
    subscribe(topic: string) {
        if (!this.connected) {
            console.error('WebSocket is not connected.');
            return;
        }

        const message = JSON.stringify({
            command: 'SUBSCRIBE',
            topic: topic,
        });

        this.ws?.send(message);
        console.log(`Subscribed to topic: ${topic}`);
    }

    // Publish a message to a specific topic
    publish(topic: string, message: string) {
        if (!this.connected) {
            console.error('WebSocket is not connected.');
            return;
        }

        const messageData = JSON.stringify({
            command: 'PUBLISH',
            topic: topic,
            msg: message,
        });

        this.ws?.send(messageData);
        console.log(`Published message to topic ${topic}: ${message}`);
    }
}

export default PubSubClient;
