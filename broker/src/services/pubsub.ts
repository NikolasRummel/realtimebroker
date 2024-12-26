import * as grpc from '@grpc/grpc-js';
import { TopicStore } from "../store/store";

let subscriberIdCounter = 0;

export const onPublish = (topic: string, message: string) => {
    const subscribers = TopicStore.getSubscribers(topic);

    if (subscribers && subscribers.length > 0) {
        subscribers.forEach(subscriber => {
            try {
                subscriber.write({ topic, message });
            } catch (error) {
                console.error(`Error writing to subscriber on topic ${topic}:`, error);
            }
        });
        console.log(`Message published to topic ${topic}: ${message}`);

        // Store the message for the topic
        TopicStore.addMessage(topic, message);

        // Update activity data
        TopicStore.updateActivity(topic, {
            messageCount: (TopicStore.getActivity(topic)?.messageCount || 0) + 1,
            lastUpdated: new Date().toISOString(),
        });
    } else {
        console.log(`No subscribers for topic: ${topic}`);
    }
};

export const handleSubscription = (call: grpc.ServerWritableStream<any, any>) => {
    const topic = call.request.topic;
    const subscriberId = String(subscriberIdCounter++);  // Generate a unique subscriber ID

    TopicStore.addSubscriber(topic, call);
    console.log(`New subscriber to topic: ${topic}, Subscriber ID: ${subscriberId}`);

    TopicStore.addSubscriptionDuration(topic, subscriberId);

    const activity = TopicStore.getActivity(topic) || { lastUpdated: '', subscriberCount: 0, messageCount: 0 };
    TopicStore.updateActivity(topic, {
        subscriberCount: activity.subscriberCount + 1,
        lastUpdated: new Date().toISOString(),
    });

    call.on('end', () => {
        console.log(`Subscriber disconnected from topic: ${topic}, Subscriber ID: ${subscriberId}`);

        TopicStore.removeSubscriber(topic, call);

        const subscriberData = TopicStore.getSubscriptionDurations(topic)?.get(subscriberId);
        if (subscriberData) {
            const duration = Date.now() - subscriberData.startTime;
            console.log(`Subscriber ${subscriberId} was connected for ${duration} ms`);

            TopicStore.removeSubscriptionDuration(topic, subscriberId);
        }

        const currentActivity = TopicStore.getActivity(topic);
        if (currentActivity) {
            TopicStore.updateActivity(topic, {
                subscriberCount: Math.max(currentActivity.subscriberCount - 1, 0),
                lastUpdated: new Date().toISOString(),
            });
        }
    });
};
