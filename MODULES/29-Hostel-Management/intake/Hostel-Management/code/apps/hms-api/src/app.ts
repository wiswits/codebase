import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { config } from './config';
import { logger } from './config/logger';
import { databasePlugin } from './plugins/database';
import { authPlugin } from './plugins/auth';
import { tenantPlugin } from './plugins/tenant';
import { permissionPlugin } from './plugins/permissions';
import { auditPlugin } from './plugins/audit';
import { errorHandler } from './plugins/errorHandler';
import { rateLimitPlugin } from './plugins/rateLimit';
import { redisPlugin } from './plugins/redis';
import { registerRoutes } from './routes';

export async function buildApp(): Promise<FastifyInstance> {
  const app = fastify({
    logger,
    trustProxy: config.trustProxy,
    requestIdHeader: config.requestIdHeader,
    ignoreTrailingSlash: true,
    caseSensitive: true,
  });

  // Error handler
  app.setErrorHandler(errorHandler);

  // Health check endpoint
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
  }));

  // Readiness probe
  app.get('/ready', async () => {
    // Check database connection
    // Check redis connection
    return { status: 'ready' };
  });

  // Security plugins
  await app.register(helmet, {
    global: config.helmetEnabled,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'validator.swagger.io'],
      },
    },
  });

  // CORS
  await app.register(cors, {
    origin: config.corsOrigin,
    credentials: config.corsCredentials,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID'],
  });

  // Database
  await app.register(databasePlugin);

  // Redis
  await app.register(redisPlugin);

  // Rate limiting
  await app.register(rateLimitPlugin);

  // Authentication (APEX JWT validation)
  await app.register(authPlugin);

  // Tenant isolation
  await app.register(tenantPlugin);

  // Permissions (RBAC)
  await app.register(permissionPlugin);

  // Audit logging
  await app.register(auditPlugin);

  // Routes
  await app.register(registerRoutes, { prefix: '/hms/v1' });

  // Swagger (development only)
  if (config.nodeEnv === 'development') {
    await app.register(import('@fastify/swagger'), {
      openapi: {
        info: {
          title: 'HMS API',
          description: 'Hostel Management System API',
          version: '1.0.0',
        },
        servers: [
          {
            url: 'http://localhost:4000',
            description: 'Development server',
          },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
        security: [{ bearerAuth: [] }],
      },
    });

    await app.register(import('@fastify/swagger-ui'), {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: true,
      },
    });
  }

  return app;
}