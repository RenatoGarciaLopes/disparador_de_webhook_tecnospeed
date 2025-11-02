import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

export function registerAuthDocs(registry: OpenAPIRegistry) {
  registry.registerComponent("securitySchemes", "CNPJ Software House", {
    type: "apiKey",
    in: "header",
    name: "x-api-cnpj-sh",
    description: "CNPJ da Software House",
  });
  registry.registerComponent("securitySchemes", "Token Software House", {
    type: "apiKey",
    in: "header",
    name: "x-api-token-sh",
    description: "Token da Software House",
  });
  registry.registerComponent("securitySchemes", "CNPJ Cedente", {
    type: "apiKey",
    in: "header",
    name: "x-api-cnpj-cedente",
    description: "CNPJ do Cedente",
  });
  registry.registerComponent("securitySchemes", "Token Cedente", {
    type: "apiKey",
    in: "header",
    name: "x-api-token-cedente",
    description: "Token do Cedente",
  });
}
