import * as grpc from '@grpc/grpc-js';
import WebSocket from 'ws';
import { TopicStore } from "../store/store";

let subscriberIdCounter = 0;

export const onPublish = (topic: string, message: string) => {
    // Publish to gRPC subscribers
    const grpcSubscribers = TopicStore.getGrpcSubscribers(topic);
    if (grpcSubscribers && grpcSubscribers.length > 0) {
        grpcSubscribers.forEach(subscriber => {
            try {
                subscriber.write({ topic, message });
            } catch (error) {
                console.error(`Error writing to gRPC subscriber on topic ${topic}:`, error);
            }
        });
        console.log(`Message published to gRPC subscribers for topic ${topic}: ${message}`);
    } else {
        console.log(`No gRPC subscribers for topic: ${topic}`);
    }

    // Publish to WebSocket subscribers
    const wsSubscribers = TopicStore.getWsSubscribers(topic);
    if (wsSubscribers.length > 0) {
        wsSubscribers.forEach(ws => {
            try {
                console.log("Sending message to ws subscriber: " + JSON.stringify({ topic, message }));
                ws.send(JSON.stringify({ topic, message }));
            } catch (error) {
                console.error(`Error writing to WebSocket subscriber on topic ${topic}:`, error);
            }
        });
        console.log(`Message published to WebSocket subscribers for topic ${topic}: ${message}`);
    } else {
        console.log(`No WebSocket subscribers for topic: ${topic}`);
    }

    // Store the message for the topic
    TopicStore.saveMessage(topic, message);

    // Update activity data
    TopicStore.updateActivity(topic, {
        messageCount: (TopicStore.getActivity(topic)?.messageCount || 0) + 1,
        lastUpdated: new Date().toISOString(),
    });
};

export const handleGrpcSubscription = (call: grpc.ServerWritableStream<any, any>) => {
    const topic = call.request.topic;
    const subscriberId = String(subscriberIdCounter++);  // Generate a unique subscriber ID

    // Add gRPC subscriber to TopicStore
    TopicStore.grpcAddSubscriber(topic, call);
    console.log(`New gRPC subscriber to topic: ${topic}, Subscriber ID: ${subscriberId}`);

    // Track subscription duration
    TopicStore.addSubscriptionDuration(topic, subscriberId);

    const activity = TopicStore.getActivity(topic) || { lastUpdated: '', subscriberCount: 0, messageCount: 0 };
    TopicStore.updateActivity(topic, {
        subscriberCount: activity.subscriberCount + 1,
        lastUpdated: new Date().toISOString(),
    });

    call.on('end', () => {
        console.log(`gRPC subscriber disconnected from topic: ${topic}, Subscriber ID: ${subscriberId}`);

        // Remove gRPC subscriber from TopicStore
        TopicStore.grpcRemoveSubscriber(topic, call);

        const subscriberData = TopicStore.getSubscriptionDurations(topic)?.get(subscriberId);
        if (subscriberData) {
            const duration = Date.now() - subscriberData.startTime;
            console.log(`gRPC Subscriber ${subscriberId} was connected for ${duration} ms`);

            // Remove subscription duration
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

export const handleWsSubscription = (ws: WebSocket, topic: string) => {
    const subscriberId = String(subscriberIdCounter++);  // Generate a unique subscriber ID

    // Add WebSocket subscriber to TopicStore
    TopicStore.wsAddSubscriber(topic, ws);
    console.log(`New WebSocket subscriber to topic: ${topic}, Subscriber ID: ${subscriberId}`);

    // Track subscription duration
    TopicStore.addSubscriptionDuration(topic, subscriberId);

    const activity = TopicStore.getActivity(topic) || { lastUpdated: '', subscriberCount: 0, messageCount: 0 };
    TopicStore.updateActivity(topic, {
        subscriberCount: activity.subscriberCount + 1,
        lastUpdated: new Date().toISOString(),
    });

    ws.on('close', () => {
        console.log(`WebSocket subscriber disconnected from topic: ${topic}, Subscriber ID: ${subscriberId}`);

        // Remove WebSocket subscriber from TopicStore
        TopicStore.wsRemoveSubscriber(ws);

        const subscriberData = TopicStore.getSubscriptionDurations(topic)?.get(subscriberId);
        if (subscriberData) {
            const duration = Date.now() - subscriberData.startTime;
            console.log(`WebSocket Subscriber ${subscriberId} was connected for ${duration} ms`);

            // Remove subscription duration
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
