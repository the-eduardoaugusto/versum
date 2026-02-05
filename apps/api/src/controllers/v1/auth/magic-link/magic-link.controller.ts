import { MagicLinkService, SendEmailService } from "@/services";
import { ApiResponseViewModel } from "@/viewmodels";
import { Body, Controller, Post, Req, Res } from "azurajs/decorators";
import { ResponseServer } from "azurajs/types";
import { BadRequestError } from "@/utils/error-model";
import { handleError } from "@/utils/error-handler.util";
import { Swagger } from "azurajs/swagger";
import { magicLinkV1Swagger } from "@/swaggers";

@Controller("/api/v1/auth/magic-link")
export class MagicLinkController {
  private magicLinkService: MagicLinkService;
  private sendEmailService: SendEmailService;

  constructor() {
    this.magicLinkService = new MagicLinkService();
    this.sendEmailService = new SendEmailService();
  }

  @Post("/")
  @Swagger(magicLinkV1Swagger.sendMagicLink)
  async sendMagicLink(
    @Res() res: ResponseServer,
    @Body("email") email: string,
    @Body("redirectUrl") redirectUrl: string,
  ) {
    try {
      if (!email || !redirectUrl) {
        throw new BadRequestError(
          "Provide email and redirectUrl in request body!",
        );
      }

      const token = await this.magicLinkService.createToken({
        email,
      });

      const url = new URL(redirectUrl);
      url.searchParams.append("token", token);

      await this.sendEmailService.sendEmail({
        to: email,
        html: `<a href='${url.href}'>Entrar</a>`,
        subject: "Seu link mágico ✨",
      });

      const response = new ApiResponseViewModel({
        message: "Email sent!",
        token,
      });
      return res.status(200).json(response.toJSON());
    } catch (error) {
      return handleError(error, res, "controller de magic link");
    }
  }
}
