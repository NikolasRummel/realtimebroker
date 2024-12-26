import * as grpc from '@grpc/grpc-js';
import chalk from 'chalk';
import * as figlet from 'figlet';
import * as path from 'path';
import * as protoLoader from '@grpc/proto-loader';
import { CONFIG } from '../config';
import {handleGrpcSubscription, onPublish} from "./pubsub";

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
    server: new grpc.Server(),

    registerService: () => {
        GrpcService.server.addService(proto.pubsub.PubSubService.service, {
            Publish: (call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) => {
                const { topic, message } = call.request;
                onPublish(topic, message);
                callback(null, { success: true });
            },
            Subscribe: handleGrpcSubscription,
        });
    },

    startServer: () => {
        const port = CONFIG.grpcPort;

        GrpcService.server.bindAsync(
            `0.0.0.0:${port}`,
            grpc.ServerCredentials.createInsecure(),
            (err) => {
                if (err) {
                    console.error(chalk.red(`Failed to bind grpc server: ${err.message}`));
                    return;
                }

                console.log(chalk.cyan(`Started Grpc server at http://localhost:${port}`));
                GrpcService.server.start();
            }
        );
    },
};
