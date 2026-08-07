import { config } from './index';

export const authConfig = {
  jwtPublicKey: config.jwtPublicKey,
  audience: config.jwtAudience,
  issuer: config.jwtIssuer,
  algorithms: config.jwtAlgorithms,
  jwksUrl: config.apexJwksUrl,
};

export const getJwksClientConfig = () => ({
  jwksUri: authConfig.jwksUrl,
  cache: true,
  cacheMaxAge: 3600000, // 1 hour
  rateLimit: true,
});

export const getJwtVerifyOptions = () => ({
  algorithms: authConfig.algorithms,
  audience: authConfig.audience,
  issuer: authConfig.issuer,
});