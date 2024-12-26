import * as grpc from '@grpc/grpc-js';
import chalk from 'chalk';
import * as figlet from 'figlet';
import * as path from 'path';
import * as protoLoader from '@grpc/proto-loader';
import { CONFIG } from '../config';
import { handleSubscription, onPublish } from './pubsub';
import {TopicStore} from "../store/store";

const PROTO_PATH = path.join(__dirname, '../../../protos/pubsub.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});
const proto = grpc.loadPackageDefinition(packageDefinition) as any;

export const GrpcService = {
    addSubscriber: (topic: string, call: grpc.ServerWritableStream<any, any>) => {
        TopicStore.addSubscriber(topic, call);
    },

    removeSubscriber: (topic: string, call: grpc.ServerWritableStream<any, any>) => {
        TopicStore.removeSubscriber(topic, call);
    },

    getSubscribers: (topic: string) => {
        return TopicStore.getSubscribers(topic);
    },

    server: new grpc.Server(),

    registerService: () => {
        GrpcService.server.addService(proto.pubsub.PubSubService.service, {
            Publish: (call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) => {
                const { topic, message } = call.request;
                onPublish(topic, message);
                callback(null, { success: true });
            },
            Subscribe: handleSubscription,
        });
    },

    startServer: () => {
        console.log(chalk.gray(`Starting RealtimeBroker...`));
        console.log(chalk.blue(figlet.textSync('RealtimeBroker', { horizontalLayout: 'full' })));

        const port = CONFIG.grpcPort;
        const version = CONFIG.version;
        const startTime = Date.now();

        console.log(chalk.yellow(`Version: v${version}`));

        GrpcService.server.bindAsync(
            `0.0.0.0:${port}`,
            grpc.ServerCredentials.createInsecure(),
            (err) => {
                if (err) {
                    console.error(chalk.red(`Failed to bind server: ${err.message}`));
                    return;
                }
                const endTime = Date.now();
                const startupDuration = endTime - startTime;

                console.log(chalk.cyan(`Started RealtimeBroker v${version} at http://localhost:${port}`));
                console.log(chalk.magenta(`Took: ${startupDuration} ms`));

                GrpcService.server.start();
            }
        );
    },
};
