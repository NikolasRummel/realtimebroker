import { useState, useEffect } from 'react';
import PubSubClient from "@/lib/pubsubclient";

// Hook to get all messages from a topic
export function useMessagesFromTopic(topic: string) {
    const [messages, setMessages] = useState<string[]>([]);

    useEffect(() => {
        const pubSubClient = PubSubClient.getInstance();

        // Ensure the WebSocket connection is established
        const connectAndSubscribe = async () => {
            try {
                await pubSubClient.connect(); // Connect only once
                pubSubClient.subscribe(topic); // Subscribe to the topic

                // Handle new messages for this topic
                const handleNewMessage = (message: string) => {
                    alert("New message: " + message); // Trigger the alert on new message
                    setMessages((prevMessages) => [...prevMessages, message]); // Update the message state
                };

                // Listen for incoming messages for the topic
                pubSubClient.on(topic, handleNewMessage);

                // Cleanup function to unsubscribe when the component unmounts
                return () => {
                    pubSubClient.removeListener(topic, handleNewMessage); // Remove listener on cleanup
                };
            } catch (error) {
                console.error('WebSocket connection failed:', error);
            }
        };

        // Run the async function to connect and subscribe
        connectAndSubscribe();

        // Effect cleanup to unsubscribe when the component unmounts
        return () => {
            pubSubClient.removeListener(topic, () => {}); // Cleanup listener on unmount
        };

    }, [topic]);

    return messages;
}
