import { Controller, Get, Res } from "azurajs/decorators";
import { ResponseServer } from "azurajs/types";
import { ApiResponseViewModel } from "@/viewmodels";
import { Swagger } from "azurajs/swagger";
import { appSwagger } from "@/swaggers";

@Controller("/")
export class AppController {
  @Get()
  @Swagger(appSwagger.getRoot)
  getRoot(@Res() res: ResponseServer) {
    const responseData = {
      latin: "Ego sum via et veritas et vita!",
      ptBR: "Eu sou o caminho, a verdade e a vida!",
      enUS: "I am the way, the truth, and the life!",
    };

    const response = new ApiResponseViewModel(responseData);
    res.json(response.toJSON());
  }
}
