import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { bodyLimit } from "hono/body-limit";
import { AuthMiddleware } from "@/middlewares/auth.middleware.ts";
import { AvatarUploadRateLimiter } from "@/middlewares/rate-limiter/middleware.ts";
import { createErrorResponses } from "../../../utils/app/errors/openapi.ts";
import { validationErrorHook } from "../../../utils/app/errors/validation.hook.ts";
import type { ProfileControllerV1 } from "../controllers/profile.v1.controller.ts";
import {
  checkUsernameAvailabilityResponseSchema,
  createProfileBodySchema,
  createProfileResponseSchema,
  deleteAvatarResponseSchema,
  getAuthenticatedProfileResponseSchema,
  getProfileByUsernameResponseSchema,
  updateAuthenticatedProfileBodySchema,
  updateAuthenticatedProfileResponseSchema,
  updateProfilePictureResponseSchema,
  uploadProfilePictureBodySchema,
  usernameParamSchema,
} from "../schemas/v1/profiles.v1.common.schema.ts";
import { MAX_AVATAR_BYTES } from "../utils/avatar-validation.ts";

export const createProfileRoutesV1 = (controller: ProfileControllerV1) => {
  const router = new OpenAPIHono({
    defaultHook: validationErrorHook,
  });

  const authMiddleware = new AuthMiddleware();
  const avatarRateLimiter = new AvatarUploadRateLimiter();

  const createProfileRoute = createRoute({
    method: "post",
    path: "/@me",
    tags: ["Profiles"],
    summary: "Criar perfil do usuário autenticado",
    security: [{ cookieAuth: [] }],
    description: "Cria um novo perfil para o usuário autenticado.",
    request: {
      body: {
        content: {
          "application/json": {
            schema: createProfileBodySchema,
          },
        },
      },
    },
    responses: {
      201: {
        content: {
          "application/json": {
            schema: createProfileResponseSchema,
          },
        },
        description: "Perfil criado com sucesso",
      },
      ...createErrorResponses([400, 401, 409, 429, 500]),
    },
  });

  const getMeRoute = createRoute({
    method: "get",
    path: "/@me",
    tags: ["Profiles"],
    summary: "Obter perfil do usuário autenticado",
    description: "Retorna os dados do perfil do usuário autenticado.",
    security: [{ cookieAuth: [] }],
    responses: {
      200: {
        content: {
          "application/json": {
            schema: getAuthenticatedProfileResponseSchema,
          },
        },
        description: "Perfil retornado com sucesso",
      },
      ...createErrorResponses([401, 404, 429, 500]),
    },
  });

  const updateMeRoute = createRoute({
    method: "patch",
    path: "/@me",
    tags: ["Profiles"],
    summary: "Atualizar perfil do usuário autenticado",
    description: "Atualiza os dados do perfil do usuário autenticado.",
    security: [{ cookieAuth: [] }],
    request: {
      body: {
        content: {
          "application/json": {
            schema: updateAuthenticatedProfileBodySchema,
          },
        },
      },
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: updateAuthenticatedProfileResponseSchema,
          },
        },
        description: "Perfil atualizado com sucesso",
      },
      ...createErrorResponses([400, 401, 404, 409, 429, 500]),
    },
  });

  const getByUsernameRoute = createRoute({
    method: "get",
    path: "/{username}",
    tags: ["Profiles"],
    summary: "Obter perfil por username",
    description: "Retorna os dados públicos de um perfil pelo username.",
    security: [{ cookieAuth: [] }],
    request: {
      params: usernameParamSchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: getProfileByUsernameResponseSchema,
          },
        },
        description: "Perfil retornado com sucesso",
      },
      ...createErrorResponses([404, 429, 500]),
    },
  });

  const checkUsernameRoute = createRoute({
    method: "get",
    path: "/check-username/{username}",
    tags: ["Profiles"],
    summary: "Verificar disponibilidade de username",
    description: "Verifica se um username está disponível para usar.",
    security: [{ cookieAuth: [] }],
    request: {
      params: usernameParamSchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: checkUsernameAvailabilityResponseSchema,
          },
        },
        description: "Disponibilidade do username verificada",
      },
      ...createErrorResponses([400, 401, 429, 500]),
    },
  });

  const uploadAvatarRoute = createRoute({
    method: "post",
    path: "/@me/avatar",
    tags: ["Profiles"],
    summary: "Upload de foto de perfil",
    description:
      "Faz upload de uma nova foto de perfil. Formatos: JPEG, PNG, WEBP. Tamanho máximo: 5MB.",
    security: [{ cookieAuth: [] }],
    request: {
      body: {
        content: {
          "multipart/form-data": {
            schema: uploadProfilePictureBodySchema,
          },
        },
      },
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: updateProfilePictureResponseSchema,
          },
        },
        description: "Foto de perfil atualizada com sucesso",
      },
      ...createErrorResponses([400, 401, 413, 429, 500]),
    },
  });

  const deleteAvatarRoute = createRoute({
    method: "delete",
    path: "/@me/avatar",
    tags: ["Profiles"],
    summary: "Deletar foto de perfil",
    description: "Remove a foto de perfil do usuário autenticado.",
    security: [{ cookieAuth: [] }],
    responses: {
      200: {
        content: {
          "application/json": {
            schema: deleteAvatarResponseSchema,
          },
        },
        description: "Foto de perfil removida com sucesso",
      },
      ...createErrorResponses([401, 404, 429, 500]),
    },
  });

  router.use("/*", authMiddleware.validateSession);

  router.use(
    "/@me/avatar",
    avatarRateLimiter.middleware,
    bodyLimit({ maxSize: MAX_AVATAR_BYTES }),
  );

  router.openapi(createProfileRoute, controller.createProfile);
  router.openapi(getMeRoute, controller.getAuthenticatedProfile);
  router.openapi(updateMeRoute, controller.updateAuthenticatedProfile);
  router.openapi(getByUsernameRoute, controller.getProfileByUsername);
  router.openapi(checkUsernameRoute, controller.checkUsername);
  router.openapi(uploadAvatarRoute, controller.uploadAvatar);
  router.openapi(deleteAvatarRoute, controller.deleteAvatar);

  return router;
};
