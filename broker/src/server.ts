import { GrpcService } from './services/grpc-service';
import app from "./api/restapi";
import { CONFIG } from "./config";
import chalk from "chalk";
import { WebSocketService } from "./services/websocket-service";
import * as figlet from "figlet";

const version = CONFIG.version;

const startApp = async () => {

    try {
        console.log(chalk.gray(`Starting RealtimeBroker...`));
        console.log(chalk.blue(figlet.textSync('RealtimeBroker', { horizontalLayout: 'full' })));
        console.log(chalk.yellow(`Version: v${version}`));

        GrpcService.registerService();
        GrpcService.startServer();

        WebSocketService.startServer();

        app.listen(CONFIG.restApiPort, () => {
            console.log(chalk.cyan(`Started RestAPI at http://localhost:${CONFIG.restApiPort}`));
        });

    } catch (error) {
        console.error(chalk.red('Error during startup:', error));
    }
};

startApp();  // Run the async startup function
