import { GrpcService } from "./grpc-service";
import * as grpc from '@grpc/grpc-js';
import {topicMessages, topicActivity, topicSubscriptionDurations} from "../store/store";

export const onPublish = (topic: string, message: string) => {
    const subscribers = GrpcService.getSubscribers(topic);

    if (subscribers && subscribers.length > 0) {
        subscribers.forEach(subscriber => {
            subscriber.write({ topic, message });
        });
        console.log(`Message published to topic ${topic}: ${message}`);

        // Add message to the topicMessages
        if (!topicMessages[topic]) {
            topicMessages[topic] = [];
        }
        topicMessages[topic].push(message);

        // Update topic activity
        if (!topicActivity[topic]) {
            topicActivity[topic] = { lastUpdated: new Date().toISOString(), subscriberCount: 0, messageCount: 0 };
        }
        topicActivity[topic].messageCount += 1;
        topicActivity[topic].lastUpdated = new Date().toISOString();

    } else {
        console.log(`No subscribers for topic: ${topic}`);
    }
};

let subscriberIdCounter = 0;

// Handle new subscriber
export const handleSubscription = (call: grpc.ServerWritableStream<any, any>) => {
    const topic = call.request.topic;
    const subscriberId = subscriberIdCounter++;

    GrpcService.addSubscriber(topic, call);
    console.log(`New subscriber to topic: ${topic}`);

    // Initialize subscriber activity tracking
    if (!topicSubscriptionDurations[topic]) {
        topicSubscriptionDurations[topic] = {};
    }
    topicSubscriptionDurations[topic][subscriberId] = new Date().getTime();

    // Update topic activity for subscribers
    if (!topicActivity[topic]) {
        topicActivity[topic] = { lastUpdated: new Date().toISOString(), subscriberCount: 0, messageCount: 0 };
    }
    topicActivity[topic].subscriberCount += 1;
    topicActivity[topic].lastUpdated = new Date().toISOString();

    // When the subscription ends, remove the subscriber and track the subscription duration
    call.on('end', () => {
        GrpcService.removeSubscriber(topic, call);
        console.log(`Subscriber removed from topic: ${topic}`);

        // Calculate subscription duration
        const subscriptionStart = topicSubscriptionDurations[topic][subscriberId];
        const subscriptionDuration = new Date().getTime() - subscriptionStart;
        console.log(`Subscriber was connected for ${subscriptionDuration} ms`);

        // Remove subscriber's duration tracking and update topic activity
        delete topicSubscriptionDurations[topic][subscriberId];
        topicActivity[topic].subscriberCount -= 1;
        topicActivity[topic].lastUpdated = new Date().toISOString();
    });
};