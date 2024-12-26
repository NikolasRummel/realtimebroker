import { GrpcService } from './services/grpc-service';
import app from "./api/restapi";
import {CONFIG} from "./config";
import chalk from "chalk";

GrpcService.registerService();
GrpcService.startServer();

app.listen(CONFIG.restApiPort, () => {
    console.log(chalk.cyan(`Started RestAPI at http://localhost:${CONFIG.restApiPort}`));
});

