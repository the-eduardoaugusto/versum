import { Controller, Get, Res } from "azurajs/decorators";
import { ResponseServer } from "azurajs/types";

@Controller("/")
export class AppController {
  @Get()
  getRoot(@Res() res: ResponseServer) {
    res.send("Ego sum via et veritas et vita!");
  }
}
