import { Body, Controller, Post, Res } from "azurajs/decorators";
import { ResponseServer } from "azurajs/types";
import { v } from "azurajs/validators";
import { prisma } from "../../libs/prisma";
import { randomBytes } from "crypto";
import { hash } from "bcrypt";
import { v4 as uuidV4 } from "uuid";

@Controller("/api/auth")
export class AuthController {
  @Post("/magic-link/send")
  async sendMagicLink(
    @Body("email") email: string,
    @Res() res: ResponseServer
  ) {
    const parseEmail = v.string().email().safeParse(email.trim());

    if (!parseEmail.success) {
      return res.status(400).json({ error: "Invalid email address." });
    }

    try {
      let user = await prisma.user.findUnique({
        where: {
          email: parseEmail.data,
        },
      });

      if (!user) {
        const tempName = email.split("@")[0].slice(0, 20);
        user = await prisma.user.create({
          data: {
            email: parseEmail.data,
            name: tempName,
            username: tempName + randomBytes(4).toString("hex"),
          },
        });
      }

      const token = uuidV4();
      const tokenHash = await hash(token, 10);

      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await prisma.magic_link.deleteMany({
        where: {
          email: parseEmail.data,
          used: false,
        },
      });

      await prisma.magic_link.create({
        data: {
          email: parseEmail.data,
          token: tokenHash,
          expires_at: expiresAt,
        },
      });

      // const magicLinkUrl = `http://localhost:5173/auth/verify?token=${token}`;

      return res
        .status(200)
        .json({ message: "Magic link sent successfully.", success: true });
    } catch (error) {
      console.error("Error in sendMagicLink:", error);
      return res
        .status(500)
        .json({ error: "An error occurred while processing your request." });
    }
  }
}
