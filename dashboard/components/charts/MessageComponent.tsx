// src/components/MessageComponent.tsx

import React, { useEffect, useState } from 'react';
import { PubSubServiceClient } from '@/lib/proto/pubsub_grpc_web_pb'; // Adjust path as necessary
import { Message, SubscribeRequest } from '@/lib/proto/pubsub_pb';

const client = new PubSubServiceClient('http://localhost:8080', null, null); // Point to your gRPC-web-enabled server

const MessageComponent = () => {
    const [messages, setMessages] = useState<string[]>([]);

    const subscribeToTopic = (topic: string) => {
        const request = new SubscribeRequest();
        request.setTopic(topic);

        // Subscribe to the topic
        const stream = client.subscribe(request, {});

        stream.on('data', (message) => {
            console.log(`Received message on topic ${message.getTopic()}: ${message.getMessage()}`);
            setMessages((prevMessages) => [...prevMessages, message.getMessage()]);
        });

        stream.on('error', (err) => {
            console.error(`Subscription error for topic ${topic}: ${err.message}`);
        });

        stream.on('end', () => {
            console.log(`Subscription to topic ${topic} ended.`);
        });
    };

    useEffect(() => {
        // Subscribe to multiple topics
        subscribeToTopic('MAIN');
        subscribeToTopic('INFO');
    }, []);

    return (
        <div>
            <h2>Messages</h2>
            <ul>
                {messages.map((msg, index) => (
                    <li key={index}>{msg}</li>
                ))}
            </ul>
        </div>
    );
};

export default MessageComponent;
