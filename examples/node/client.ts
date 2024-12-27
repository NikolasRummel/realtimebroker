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
subscribeToTopic('INFO');

const publishMessages = async () => {
    while (true) {
        const randomObject = {
            "name": "John Doe",
            "age": 25,
            "city": generateRandomString(10)
        }
        publishMessage('MAIN', JSON.stringify(randomObject));

        // Wait for a random delay between 100ms and 10,000ms
        const delay2 = getRandomInt(20, 1500);
        console.log(`Next message will be published in ${delay2}ms`);

        // Wait for the random delay before publishing the next message
        await new Promise(resolve => setTimeout(resolve, delay2));
    }
};

// Start publishing messages
publishMessages();

function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
// Function to generate a random string
function generateRandomString(length = 10) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}