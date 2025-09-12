import Joi from "joi";

interface EnvSchema {
  NODE_ENV: string;
  PORT: number;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_DATABASE: string;
  DB_HOST: string;
  DB_PORT: number;
}

const envSchema = Joi.object<EnvSchema>({
  NODE_ENV: Joi.string().valid("development", "production").required(),
  PORT: Joi.number().required(),

  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_DATABASE: Joi.string().required(),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().required(),
});

const { value } = envSchema.validate(process.env);

export const config: EnvSchema = value;
