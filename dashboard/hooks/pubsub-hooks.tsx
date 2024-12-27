import { useState, useEffect } from "react";
import PubSubClient, { PubSubMessage } from "@/lib/pubsubclient";

async function connectAndSubscribe(
    pubSubClient: PubSubClient,
    topic: string,
    messageHandler: (message: PubSubMessage) => void
) {
    try {
        if (!pubSubClient.connected) {
            await pubSubClient.connect();
        }

        if (!pubSubClient.isSubscribed(topic)) {
            pubSubClient.subscribe(topic);
        }

        // Add listener for messages
        pubSubClient.on(topic, messageHandler);
    } catch (error) {
        console.error("Failed to connect or subscribe:", error);
    }
}

export function useMessagesFromTopic(topic: string) {
    const [messages, setMessages] = useState<PubSubMessage[]>([]);

    useEffect(() => {
        const pubSubClient = PubSubClient.getInstance();

        const handleNewMessage = (message: PubSubMessage) => {
            setMessages((prevMessages) => [...prevMessages, message]);
        };

        connectAndSubscribe(pubSubClient, topic, handleNewMessage);

        return () => {
            pubSubClient.removeListener(topic, handleNewMessage);
        };
    }, [topic]);

    return messages;
}

export function useLatestMessageFromTopic(topic: string) {
    const [latestMessage, setLatestMessage] = useState<PubSubMessage | null>(null);

    useEffect(() => {
        const pubSubClient = PubSubClient.getInstance();

        const handleNewMessage = (message: PubSubMessage) => {
            setLatestMessage(message);
        };

        connectAndSubscribe(pubSubClient, topic, handleNewMessage);

        return () => {
            pubSubClient.removeListener(topic, handleNewMessage);
        };
    }, [topic]);

    return latestMessage;
}
