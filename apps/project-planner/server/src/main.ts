import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import fastifyPassport from '@fastify/passport';
import fastifySession from '@fastify/session';
import dotenv from 'dotenv';

import { loadConfig } from './config';
import { authRouter } from './auth/auth.router';
import { plannerRouter } from './planner/planner.router';
import { googleStrategy, githubStrategy } from './auth/strategies';
import { ConfigService } from './config/config.service';

dotenv.config();
const configService = new ConfigService();

const build = async () => {
  const config = loadConfig();

  const fastify = Fastify({ logger: true });

  await fastify.register(cors, {
    origin: config.FRONTEND_URL,
    credentials: true,
  });

  await fastify.register(cookie);
  await fastify.register(fastifySession, {
    secret: config.JWT_SECRET, // Use a strong, unique secret for session management
    cookie: {
      secure: config.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  });

  fastify.register(fastifyPassport.initialize());
  fastify.register(fastifyPassport.session());

  // Register Passport strategies
  fastifyPassport.use('google', googleStrategy);
  fastifyPassport.use('github', githubStrategy);

  // Passport serialization/deserialization for sessions
  fastifyPassport.serializer(async (user: any, request) => {
    // console.log('Serializer user:', user); // Debugging line
    return user.id;
  });

  fastifyPassport.deserializer(async (id: string, request) => {
    // In a real app, you might fetch the user from the database
    // console.log('Deserializer ID:', id); // Debugging line
    return { id };
  });

  // Register routers
  fastify.register(authRouter, { prefix: '/auth' });
  fastify.register(plannerRouter, { prefix: '/api/plan' });

  return fastify;
};

const start = async () => {
  const fastify = await build();
  const port = parseInt(process.env.PORT || '4000', 10);

  try {
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`Server listening on ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

if (require.main === module) {
  start();
}

export { build };
