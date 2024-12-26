import * as grpc from '@grpc/grpc-js';
import WebSocket from 'ws'; // Import the WebSocket type from ws package

const MAX_MESSAGES = 1000;

// Types
interface TopicActivity {
    lastUpdated: string;
    subscriberCount: number;
    messageCount: number;
}

interface SubscriptionDuration {
    startTime: number;
    duration?: number;
}

interface MessageWithTimestamp {
    message: string;
    timestamp: string;
}

// Maps to store data
const topicSubscribers: Map<string, grpc.ServerWritableStream<any, any>[]> = new Map();
const topicMessages: Map<string, MessageWithTimestamp[]> = new Map();
const topicActivity: Map<string, TopicActivity> = new Map();
const topicSubscriptionDurations: Map<string, Map<string, SubscriptionDuration>> = new Map();
const topicWsSubscribers: Map<string, Set<WebSocket>> = new Map();

export const TopicStore = {
    // ------------------- General Methods -------------------

    getAllData: () => ({
        topicSubscriberCounts: Array.from(topicSubscribers.entries()).reduce(
            (acc, [topic, subscribers]) => {
                acc[topic] = subscribers.length;
                return acc;
            },
            {} as Record<string, number>
        ),
        topicMessages,
        topicActivity,
        topicSubscriptionDurations,
    }),

    getAllMessages: (): Map<string, MessageWithTimestamp[]> => {
        return topicMessages;
    },

    getAllMessagesOrderedByTimestamp: (): MessageWithTimestamp[] => {
        return Array.from(topicMessages.values())
            .flat() // Flatten the arrays of messages
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    },

    getMessages: (topic: string): MessageWithTimestamp[] => {
        return topicMessages.get(topic) || [];
    },

    saveMessage: (topic: string, message: string) => {
        // Ensure the topic exists in the message store
        if (!topicMessages.has(topic)) {
            topicMessages.set(topic, []);
        }

        const messages = topicMessages.get(topic)!;

        // If the topic exceeds the max messages, remove the oldest one
        if (messages.length >= MAX_MESSAGES) {
            messages.shift(); // Remove the oldest message
        }

        // Create the message with timestamp
        const messageWithTimestamp = {
            message,
            timestamp: new Date().toISOString(),
        };

        // Push the new message to the topic's message array
        messages.push(messageWithTimestamp);

        console.log(`Message saved for topic: ${topic}`);
    },

    getSubscriberCountByTopic: (topic: string): number =>
        topicSubscribers.get(topic)?.length || 0,

    getSubscriberCount: (): Record<string, number> =>
        Array.from(topicSubscribers.entries()).reduce(
            (acc, [topic, subscribers]) => {
                acc[topic] = subscribers.length;
                return acc;
            },
            {} as Record<string, number>
        ),

    getAllTopics: (): string[] => Array.from(topicSubscribers.keys()),

    clearAllData: () => {
        topicSubscribers.forEach((subscribers) => {
            subscribers.forEach((sub) => sub.end()); // End all subscriber streams
        });
        topicSubscribers.clear();
        topicMessages.clear();
        topicActivity.clear();
        topicSubscriptionDurations.clear();
        console.log('Cleared all topic data.');
    },

    // ------------------- gRPC Methods -------------------

    grpcAddSubscriber: (topic: string, subscriber: grpc.ServerWritableStream<any, any>) => {
        if (!topicSubscribers.has(topic)) {
            topicSubscribers.set(topic, []);
        }
        topicSubscribers.get(topic)!.push(subscriber);
    },

    grpcRemoveSubscriber: (topic: string, subscriber: grpc.ServerWritableStream<any, any>) => {
        if (!topicSubscribers.has(topic)) return;
        topicSubscribers.set(
            topic,
            topicSubscribers.get(topic)!.filter((sub) => sub !== subscriber)
        );
    },

    // ------------------- WebSocket Methods -------------------

    wsAddSubscriber: (topic: string, ws: WebSocket) => {
        if (!topicWsSubscribers.has(topic)) {
            topicWsSubscribers.set(topic, new Set<WebSocket>());
        }
        topicWsSubscribers.get(topic)!.add(ws);
    },

    wsRemoveSubscriber: (ws: WebSocket) => {
        topicWsSubscribers.forEach((subscribers, topic) => {
            if (subscribers.has(ws)) {
                subscribers.delete(ws);
            }
        });
    },

    // ------------------- Activity and Subscription Methods -------------------

    getActivity: (topic: string): TopicActivity | undefined =>
        topicActivity.get(topic),

    updateActivity: (topic: string, data: Partial<TopicActivity>) => {
        const activity = topicActivity.get(topic) || {
            lastUpdated: '',
            subscriberCount: 0,
            messageCount: 0,
        };
        topicActivity.set(topic, {...activity, ...data});
    },

    clearActivity: (topic: string) => {
        topicActivity.delete(topic);
    },

    getSubscriptionDurations: (topic: string): Map<string, SubscriptionDuration> | undefined =>
        topicSubscriptionDurations.get(topic),

    addSubscriptionDuration: (topic: string, subscriberId: string) => {
        if (!topicSubscriptionDurations.has(topic)) {
            topicSubscriptionDurations.set(topic, new Map<string, SubscriptionDuration>());
        }
        topicSubscriptionDurations.get(topic)!.set(subscriberId, {startTime: Date.now()});
    },

    getSubscriptionStartTime: (topic: string, subscriberId: string): number | undefined =>
        topicSubscriptionDurations.get(topic)?.get(subscriberId)?.startTime,

    removeSubscriptionDuration: (topic: string, subscriberId: string) => {
        const durations = topicSubscriptionDurations.get(topic);
        if (!durations?.has(subscriberId)) return;

        const subscriberData = durations.get(subscriberId)!;
        subscriberData.duration = Date.now() - subscriberData.startTime; // Calculate and store the duration
        durations.delete(subscriberId);
    },

    clearSubscriptionDurations: (topic: string) => {
        topicSubscriptionDurations.delete(topic);
    },

    // ------------------- New Methods for Retrieving Subscribers -------------------

    getWsSubscribers: (topic: string): WebSocket[] => {
        const wsSubscribers = topicWsSubscribers.get(topic);
        return wsSubscribers ? Array.from(wsSubscribers) : [];
    },

    getGrpcSubscribers: (topic: string): grpc.ServerWritableStream<any, any>[] => {
        return topicSubscribers.get(topic) || [];
    },
};
