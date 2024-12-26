import {create} from 'zustand';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

interface Message {
    topic: string;
    message: string;
    timestamp: string;
}

interface MessageStore {
    messages: Message[];
    addMessage: (message: Message) => void;
}

const useMessageStore = create<MessageStore>((set) => ({
    messages: [],
    addMessage: (message) => set((state) => ({
        messages: [...state.messages, message].slice(-1000) // Keep last 1000 messages
    })),
}));

// Setup gRPC client and subscriptions
const PROTO_PATH = '../../protos/pubsub.proto';
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const proto = grpc.loadPackageDefinition(packageDefinition) as any;
const client = new proto.pubsub.PubSubService('localhost:50051', grpc.credentials.createInsecure());

const subscribeToTopic = (topic: string) => {
    const call = client.Subscribe({topic});

    call.on('data', (message: any) => {
        const newMessage: Message = {
            topic: message.topic,
            message: message.message,
            timestamp: Date.now().toString()
        };
        useMessageStore.getState().addMessage(newMessage);
        console.log(`Received message on topic ${message.topic}: ${message.message}`);
    });

    call.on('end', () => {
        console.log(`Subscription to topic ${topic} ended.`);
    });
};

subscribeToTopic('MAIN');
subscribeToTopic('INFO');

export default useMessageStore;
