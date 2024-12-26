import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

const PROTO_PATH = '../../protos/pubsub.proto';

const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const proto = grpc.loadPackageDefinition(packageDefinition) as any;

const client = new proto.pubsub.PubSubService('localhost:50051', grpc.credentials.createInsecure());

const publishMessage = (topic: string, message: string) => {
    client.Publish({ topic, message }, (error: any, response: any) => {
        if (error) {
            console.error(`Error publishing message: ${error.message}`);
        } else {
            console.log(`Published message to topic ${topic}: ${message}`);
        }
    });
};

const subscribeToTopic = (topic: string) => {
    const call = client.Subscribe({ topic });

    call.on('data', (message: any) => {
        console.log(`Received message on topic ${message.topic}: ${message.message}`);
    });

    call.on('end', () => {
        console.log(`Subscription to topic ${topic} ended.`);
    });
};

subscribeToTopic('MAIN');

setTimeout(() => {
    publishMessage('MAIN', 'This!');
    publishMessage('MAIN', 'IS!');
    publishMessage('MAIN', 'A!');
    publishMessage('MAIN', 'TEST!');
}, 1000);
