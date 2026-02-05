import { AzuraClient } from "azurajs";
import * as controllersModule from "@/controllers";
import { ApplicationStartup } from "@/startup";
import * as middlewaresIndex from "@/middlewares";

const app = new AzuraClient();
const middlewares = Object.values(middlewaresIndex);

// Extract controller values from the module
const controllers = Object.values(controllersModule);

// Inicializar aplicação
const startup = new ApplicationStartup(app, controllers);
startup.initialize(middlewares);
