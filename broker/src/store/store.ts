import * as grpc from '@grpc/grpc-js';

const MAX_MESSAGES = 10;

const topicSubscribers = new Map<string, grpc.ServerWritableStream<any, any>[]>();
const topicMessages = new Map<string, string[]>();
const topicActivity = new Map<string, { lastUpdated: string; subscriberCount: number; messageCount: number }>();
const topicSubscriptionDurations: Map<string, Map<string, { startTime: number; duration?: number }>> = new Map();

export const TopicStore = {
    getSubscribers: (topic: string): grpc.ServerWritableStream<any, any>[] => {
        return topicSubscribers.get(topic) || [];
    },

    addSubscriber: (topic: string, subscriber: grpc.ServerWritableStream<any, any>) => {
        const subscribers = topicSubscribers.get(topic) || [];
        subscribers.push(subscriber);
        topicSubscribers.set(topic, subscribers);
    },

    removeSubscriber: (topic: string, subscriber: grpc.ServerWritableStream<any, any>) => {
        const subscribers = topicSubscribers.get(topic);
        if (subscribers) {
            topicSubscribers.set(
                topic,
                subscribers.filter(sub => sub !== subscriber)
            );
        }
    },

    getMessages: (topic: string): string[] => {
        return topicMessages.get(topic) || [];
    },

    addMessage: (topic: string, message: string) => {
        const messages = topicMessages.get(topic) || [];

        if (messages.length >= MAX_MESSAGES) {
            messages.shift();
        }

        messages.push(message);
        topicMessages.set(topic, messages);
    },

    clearMessages: (topic: string) => {
        topicMessages.delete(topic);
    },

    getActivity: (topic: string): { lastUpdated: string; subscriberCount: number; messageCount: number } | undefined => {
        return topicActivity.get(topic);
    },

    updateActivity: (topic: string, data: Partial<{ lastUpdated: string; subscriberCount: number; messageCount: number }>) => {
        const activity = topicActivity.get(topic) || { lastUpdated: '', subscriberCount: 0, messageCount: 0 };
        topicActivity.set(topic, { ...activity, ...data });
    },

    clearActivity: (topic: string) => {
        topicActivity.delete(topic);
    },

    getSubscriptionDurations: (topic: string): Map<string, { startTime: number; duration?: number }> | undefined => {
        return topicSubscriptionDurations.get(topic);
    },

    addSubscriptionDuration: (topic: string, subscriberId: string) => {
        if (!topicSubscriptionDurations.has(topic)) {
            topicSubscriptionDurations.set(topic, new Map<string, { startTime: number; duration?: number }>());
        }
        const subscriberData = { startTime: Date.now() };
        topicSubscriptionDurations.get(topic)?.set(subscriberId, subscriberData);
    },

    getSubscriptionStartTime: (topic: string, subscriberId: string): number | undefined => {
        const subscriberData = topicSubscriptionDurations.get(topic)?.get(subscriberId);
        return subscriberData?.startTime;
    },

    removeSubscriptionDuration: (topic: string, subscriberId: string) => {
        const subscriberData = topicSubscriptionDurations.get(topic)?.get(subscriberId);
        if (subscriberData) {
            const duration = Date.now() - subscriberData.startTime;
            console.log(`Subscriber ${subscriberId} was connected for ${duration} ms`);
            subscriberData.duration = duration; // Store the calculated duration
        }
        topicSubscriptionDurations.get(topic)?.delete(subscriberId);
    },

    clearSubscriptionDurations: (topic: string) => {
        topicSubscriptionDurations.delete(topic);
    },

    getAllTopics: (): string[] => {
        return Array.from(topicSubscribers.keys());
    },

    clearAllData: () => {
        topicSubscribers.forEach(subscribers => {
            subscribers.forEach(sub => sub.end());
        });
        topicSubscribers.clear();
        topicMessages.clear();
        topicActivity.clear();
        topicSubscriptionDurations.clear();
        console.log('Cleared all topic data.');
    }
};
