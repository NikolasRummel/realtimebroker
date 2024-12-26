import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { ServerWritableStream } from '@grpc/grpc-js';

const PROTO_PATH = '../protos/pubsub.proto';
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const proto = grpc.loadPackageDefinition(packageDefinition) as any;

const topicSubscribers: { [key: string]: ServerWritableStream<any, any>[] } = {};

const publish = (call: any, callback: any) => {
    const { topic, message } = call.request;

    const subscribers = topicSubscribers[topic];
    if (subscribers) {
        subscribers.forEach(subscriber => {
            subscriber.write({ topic, message });
        });
    }

    callback(null, { success: true });
};

const subscribe = (call: ServerWritableStream<any, any>) => {
    const topic = call.request.topic;

    if (!topicSubscribers[topic]) {
        topicSubscribers[topic] = [];
    }
    topicSubscribers[topic].push(call);

    console.log(`New subscriber to topic: ${topic}`);

    call.on('end', () => {
        topicSubscribers[topic] = topicSubscribers[topic].filter(sub => sub !== call);
    });
};

const server = new grpc.Server();
server.addService(proto.pubsub.PubSubService.service, { Publish: publish, Subscribe: subscribe });

const port = '50051';
server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), () => {
    console.log(`Server running at http://localhost:${port}`);
    server.start()
});
