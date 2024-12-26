import * as grpc from '@grpc/grpc-js';
import chalk from 'chalk';
import * as figlet from 'figlet';
import * as path from 'path';
import { CONFIG } from '../config';
import { handleSubscription, onPublish } from './pubsub';
import * as protoLoader from '@grpc/proto-loader';

import {topicSubscribers} from "../store/store";

const PROTO_PATH = path.join(__dirname, '../../../protos/pubsub.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const proto = grpc.loadPackageDefinition(packageDefinition) as any;


export const GrpcService = {
    addSubscriber: (topic: string, call: grpc.ServerWritableStream<any, any>) => {
        if (!topicSubscribers[topic]) {
            topicSubscribers[topic] = [];
        }
        topicSubscribers[topic].push(call);
    },

    removeSubscriber: (topic: string, call: grpc.ServerWritableStream<any, any>) => {
        const subscribers = topicSubscribers[topic];
        if (subscribers) {
            const index = subscribers.indexOf(call);
            if (index !== -1) {
                subscribers.splice(index, 1);
            }
        }
    },

    getSubscribers: (topic: string) => {
        return topicSubscribers[topic];
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
        const startTime = new Date().getTime();

        console.log(chalk.yellow(`Version: v${version}`));

        GrpcService.server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), () => {
            const endTime = new Date().getTime();
            const startupDuration = endTime - startTime;

            console.log(chalk.cyan(`Started RealtimeBroker v${version} at http://localhost:${port}`));
            console.log(chalk.magenta(`Took: ${startupDuration} ms`));

        });
    },
};
