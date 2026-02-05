import { MagicLinkService } from "@/services";
import { Controller, Get, Query, Res } from "azurajs/decorators";
import { ResponseServer } from "azurajs/types";
import { Swagger } from "azurajs/swagger";
import { magicLinkV1Swagger } from "@/swaggers";
import { handleError } from "@/utils/error-handler.util";
import { BadRequestError } from "@/utils/error-model";

@Controller("/api/v1/auth/magic-link/callback")
export class MagicLinkCallbackController {
  private magicLinkService: MagicLinkService;

  constructor() {
    this.magicLinkService = new MagicLinkService();
  }
  @Get("/")
  @Swagger(magicLinkV1Swagger.generateJwt)
  async generateJwt(@Res() res: ResponseServer, @Query("token") token: string) {
    try {
      if (!token) {
        throw new BadRequestError("Magic link token is required!");
      }

      const auth = await this.magicLinkService.authenticateToken({ token });

      return res.json({
        success: true,
        data: auth,
      });
    } catch (error) {
      return handleError(error, res, "magic link callback controller");
    }
  }
}
