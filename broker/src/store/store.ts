import * as grpc from '@grpc/grpc-js';

export const topicSubscribers: { [topic: string]: grpc.ServerWritableStream<any, any>[] } = {};
export const topicMessages: { [topic: string]: string[] } = {};
export const topicActivity: { [topic: string]: { lastUpdated: string, subscriberCount: number, messageCount: number } } = {};
export const topicSubscriptionDurations: { [topic: string]: { [subscriberId: string]: number } } = {};