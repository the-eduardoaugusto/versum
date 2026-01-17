import { AzuraClient } from "azurajs";
import { applyDecorators } from "azurajs/decorators";
import * as controllers from "./controllers";
import { publicRoutesRateLimit } from "./middlewares";
import { env } from "./env";

const app = new AzuraClient();

applyDecorators(app, Object.values(controllers));

app.use("/app/public", publicRoutesRateLimit);

app.listen(Number(env.PORT)).then(() => {
  console.log("API is running on http://localhost:3000");
});
