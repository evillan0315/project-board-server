import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fastifyPassport from '@fastify/passport';

import { PlannerService } from './planner.service';
import { LlmInputDto, CreatePlannerDto as PlanDto } from './dto';
import { ExecutorService } from './executor.service';
import { LlmService } from './llm.service';
import { GitUtilService } from '../git/git.util';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '../config';
import { CustomError } from '../common/errors';

export async function plannerRouter(fastify: FastifyInstance) {
  const configService = new ConfigService();
  const gitUtilService = new GitUtilService(configService.get('BASE_DIR'));
  const prisma = new PrismaService();
  const llmService = new LlmService(configService);
  const executorService = new ExecutorService(configService, gitUtilService);
  const plannerService = new PlannerService(llmService, executorService, prisma);

  // Middleware to ensure user is authenticated for planner routes
  const authenticate = { preHandler: fastifyPassport.authenticate('jwt', { session: false }) };

  fastify.post('/', authenticate, async (request: FastifyRequest<{ Body: LlmInputDto }>, reply: FastifyReply) => {
    try {
      const result = await plannerService.planFromPrompt(request.body, (request.user as any)?.id);
      reply.status(201).send(result);
    } catch (error: any) {
      reply.code(error.statusCode || 500).send({ error: error.message });
    }
  });

  fastify.get('/:id', authenticate, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const plan = await plannerService.getPlan(request.params.id, (request.user as any)?.id);
      if (!plan) {
        throw new CustomError('Plan not found', 404);
      }
      reply.send({ plan });
    } catch (error: any) {
      reply.code(error.statusCode || 500).send({ error: error.message });
    }
  });

  fastify.get('/:id/chunks', authenticate, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const chunks = await plannerService.chunkPlan(request.params.id, (request.user as any)?.id);
      if (!chunks) {
        throw new CustomError('Plan not found', 404);
      }
      reply.send({ chunks });
    } catch (error: any) {
      reply.code(error.statusCode || 500).send({ error: error.message });
    }
  });

  fastify.post('/:id/apply-chunk/:index', authenticate, async (request: FastifyRequest<{ Params: { id: string; index: string } }>, reply: FastifyReply) => {
    try {
      const idx = parseInt(request.params.index, 10);
      if (isNaN(idx)) {
        throw new CustomError('Invalid chunk index', 400);
      }
      const res = await plannerService.applyChunk(request.params.id, idx, (request.user as any)?.id);
      reply.status(201).send(res);
    } catch (error: any) {
      reply.code(error.statusCode || 500).send({ error: error.message });
    }
  });

  fastify.post('/apply', authenticate, async (request: FastifyRequest<{ Body: { plan: PlanDto } }>, reply: FastifyReply) => {
    try {
      const result = await plannerService.applyPlan(request.body.plan, (request.user as any)?.id);
      reply.status(201).send(result);
    } catch (error: any) {
      reply.code(error.statusCode || 500).send({ error: error.message });
    }
  });
}
