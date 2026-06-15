import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { bodyLimit } from "hono/body-limit";
import { AuthMiddleware } from "@/middlewares/auth.middleware.ts";
import { createErrorResponse, createErrorResponses } from "../../../utils/app/errors/openapi.ts";
import { validationErrorHook } from "../../../utils/app/errors/validation.hook.ts";
import { ApiErrorViewModel } from "../../../view-models/default/error.view-model.ts";
import type { ProfileControllerV1 } from "../controllers/profile.v1.controller.ts";
import {
  createProfileBodySchema,
  createProfileResponseSchema,
  getAuthenticatedProfileResponseSchema,
  getProfileByUsernameResponseSchema,
  updateAuthenticatedProfileBodySchema,
  updateAuthenticatedProfileResponseSchema,
  updateProfilePictureResponseSchema,
  uploadProfilePictureBodySchema,
  usernameParamSchema,
} from "../schemas/v1/profiles.v1.common.schema.ts";

const PROFILE_PICTURE_MAX_SIZE_BYTES = 5 * 1024 * 1024;

export const createProfileRoutesV1 = (controller: ProfileControllerV1) => {
  const router = new OpenAPIHono({
    defaultHook: validationErrorHook,
  });

  const authMiddleware = new AuthMiddleware();

  const createProfileRoute = createRoute({
    method: "post",
    path: "/@me",
    tags: ["Profiles"],
    summary: "Criar perfil do usuário autenticado",
    security: [{cookieAuth: []}],
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

  const uploadPictureRoute = createRoute({
    method: "put",
    path: "/@me/picture",
    tags: ["Profiles"],
    summary: "Atualizar foto de perfil",
    description:
      "Faz upload de uma nova foto de perfil e atualiza o perfil do usuário. Formatos aceitos: JPEG e PNG. Tamanho máximo: 5MB.",
    security: [{ cookieAuth: [] }],
    request: {
      body: {
        content: {
          "multipart/form-data": {
            schema: uploadProfilePictureBodySchema,
          },
        },
        required: true,
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
      413: createErrorResponse("Arquivo muito grande. Tamanho máximo: 5MB"),
      ...createErrorResponses([400, 401, 403, 404, 429, 500]),
    },
  });

  router.use("/*", authMiddleware.validateSession);

  router.use(
    "/@me/picture",
    bodyLimit({
      maxSize: PROFILE_PICTURE_MAX_SIZE_BYTES,
      onError: (c) =>
        c.json(
          new ApiErrorViewModel(
            "File too large. Maximum size is 5MB",
            "PAYLOAD_TOO_LARGE",
          ),
          413,
        ),
    }),
  );

  router.openapi(createProfileRoute, controller.createProfile);
  router.openapi(getMeRoute, controller.getAuthenticatedProfile);
  router.openapi(updateMeRoute, controller.updateAuthenticatedProfile);
  router.openapi(getByUsernameRoute, controller.getProfileByUsername);
  router.openapi(uploadPictureRoute, controller.updateProfilePicture);

  return router;
};
