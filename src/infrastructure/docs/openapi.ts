import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { registerAuthDocs } from "../../modules/auth/docs/openapi";
import { registerProtocoloDocs } from "../../modules/protocolo/docs/openapi";
import { registerWebhookDocs } from "../../modules/webhook/docs/openapi";
import { registerErrorResponse } from "./schemas";

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

registerAuthDocs(registry);
registerWebhookDocs(registry);
registerProtocoloDocs(registry);
registerErrorResponse(registry);

const generator = new OpenApiGeneratorV3(registry.definitions);

export function getOpenApiDocument() {
  return generator.generateDocument({
    openapi: "3.0.3",
    info: {
      title: "Tecnospeed Webhook Dispatcher API",
      version: "1.0.0",
      description:
        "Documento OpenAPI para a API do Disparador de Webhook Tecnospeed.",
    },
    servers: [{ url: "http://localhost:3000" }],
    security: [
      {
        "CNPJ Software House": [],
        "Token Software House": [],
        "CNPJ Cedente": [],
        "Token Cedente": [],
      },
    ],
  });
}
