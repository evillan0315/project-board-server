import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fastifyPassport, { AuthenticateOptions } from '@fastify/passport';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { OAuthService } from './oauth.service';
import { AuthRequest, CreateJwtUserDto, GitHubProfileDto, GitHubTokenDto, GoogleProfileDto, GoogleTokenDto, LoginDto, RegisterDto, VerifyEmailDto, ForgotPasswordDto, ResetPasswordDto, AuthResponseDto, LoginResponseDto, OAuthQuerystring } from './types';
import { ConfigService } from '../config';

// Define custom AuthenticateOptions to include 'scope' and allow 'state' as a function
interface CustomAuthenticateOptions extends AuthenticateOptions {
  scope?: string[];
  state?: string | ((req: FastifyRequest<{ Querystring: OAuthQuerystring }>) => string);
}

export async function authRouter(fastify: FastifyInstance) {
  const prisma = new PrismaService();
  const mailService = new MailService(new ConfigService());
  const oauthService = new OAuthService(prisma);
  const authService = new AuthService(prisma, mailService, oauthService, new ConfigService());
  const configService = new ConfigService();

  const handleOAuthCallback = async (provider: 'google' | 'github', req: AuthRequest) => {
    const { profile, tokens } = req.user as {
      profile: GoogleProfileDto | GitHubProfileDto;
      tokens: GoogleTokenDto | GitHubTokenDto;
    };

    const user = await authService.validateOAuthProfile(provider, profile, tokens);

    const payload: CreateJwtUserDto = {
      id: user.id,
      sub: user.id,
      email: user.email,
      role: user.role,
      image: user.image ?? undefined,
      name: user.name ?? '',
      phone_number: user.phone_number ?? '',
      provider,
      username: user.username ?? undefined,
    };

    const accessToken = await authService.generateToken(payload);
    return { accessToken, user, profile, tokens };
  };

  fastify.post('/login', async (request: FastifyRequest<{ Body: LoginDto }>, reply: FastifyReply) => {
    const { access_token, refresh_token, user } = await authService.login(request.body);
    reply.setCookie('accessToken', access_token, {
      httpOnly: true,
      secure: configService.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/',
    });
    return { access_token, refresh_token, user };
  });

  fastify.post('/logout', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.clearCookie('accessToken', { path: '/' });
    return { message: 'Logged out successfully' };
  });

  fastify.get('/google', fastifyPassport.authenticate('google', {
    scope: ['profile', 'email'],
    state: (req: FastifyRequest<{ Querystring: OAuthQuerystring }>) => JSON.stringify({
      cli_port: req.query?.cli_port,
      csrf_token: '123' // Placeholder, consider making dynamic
    })
  } as CustomAuthenticateOptions)); // Type cast to CustomAuthenticateOptions

  fastify.get('/google/callback', {
    preValidation: fastifyPassport.authenticate('google', { failureRedirect: `${configService.get('FRONTEND_URL')}/login?error=OAuth%20Login%20Failed` }),
  },
  async (request: FastifyRequest<{ Querystring: OAuthQuerystring }>, reply: FastifyReply) => {
    try {
      const authRequest = request as AuthRequest;
      const { accessToken, user } = await handleOAuthCallback('google', authRequest);

      reply.setCookie('accessToken', accessToken, {
        httpOnly: true,
        secure: configService.get('NODE_ENV') === 'production',
        sameSite: 'lax',
        path: '/',
      });

      let cliPort: string | undefined;
      if (request.query?.state) {
        try {
          const parsedState = JSON.parse(decodeURIComponent(request.query.state));
          cliPort = parsedState.cli_port;
        } catch (e: unknown) {
          if (e instanceof Error) {
            request.log.warn('Failed to parse state parameter for cli_port:', e.message, e.stack);
          } else {
            request.log.warn('Failed to parse state parameter for cli_port:', String(e));
          }
        }
      }

      const redirectUrl = cliPort
        ? `http://localhost:${cliPort}/auth/callback?accessToken=${accessToken}&userId=${user.id}&userEmail=${user.email}&userName=${encodeURIComponent(user.name || '')}&userImage=${encodeURIComponent(user.image || '')}&userRole=${user.role}&username=${encodeURIComponent(user.username || '')}&provider=google`
        : `${configService.get('FRONTEND_URL')}/login?action=success&accessToken=${accessToken}&userId=${user.id}&userEmail=${user.email}&userName=${encodeURIComponent(user.name || '')}&userImage=${encodeURIComponent(user.image || '')}&userRole=${user.role}&username=${encodeURIComponent(user.username || '')}&provider=google`;
      
      reply.redirect(redirectUrl);
    } catch (error: unknown) {
      if (error instanceof Error) {
        request.log.error('Google OAuth error:', error.message, error.stack);
      } else {
        request.log.error('Google OAuth error:', String(error));
      }
      reply.redirect(`${configService.get('FRONTEND_URL')}/login?error=OAuth%20Login%20Failed`);
    }
  });

  fastify.get('/github', fastifyPassport.authenticate('github', {
    scope: ['user:email'],
    state: (req: FastifyRequest<{ Querystring: OAuthQuerystring }>) => JSON.stringify({
      cli_port: req.query?.cli_port,
      csrf_token: '123' // Placeholder, consider making dynamic
    })
  } as CustomAuthenticateOptions)); // Type cast to CustomAuthenticateOptions

  fastify.get('/github/callback', {
    preValidation: fastifyPassport.authenticate('github', { failureRedirect: `${configService.get('FRONTEND_URL')}/login?error=OAuth%20Login%20Failed` }),
  },
  async (request: FastifyRequest<{ Querystring: OAuthQuerystring }>, reply: FastifyReply) => {
    try {
      const authRequest = request as AuthRequest;
      const { accessToken, user } = await handleOAuthCallback('github', authRequest);

      reply.setCookie('accessToken', accessToken, {
        httpOnly: true,
        secure: configService.get('NODE_ENV') === 'production',
        sameSite: 'lax',
        path: '/',
      });

      let cliPort: string | undefined;
      if (request.query?.state) {
        try {
          const parsedState = JSON.parse(decodeURIComponent(request.query.state));
          cliPort = parsedState.cli_port;
        } catch (e: unknown) {
          if (e instanceof Error) {
            request.log.warn('Failed to parse state parameter for cli_port:', e.message, e.stack);
          } else {
            request.log.warn('Failed to parse state parameter for cli_port:', String(e));
          }
        }
      }

      const redirectUrl = cliPort
        ? `http://localhost:${cliPort}/auth/callback?accessToken=${accessToken}&userId=${user.id}&userEmail=${user.email}&userName=${encodeURIComponent(user.name || '')}&userImage=${encodeURIComponent(user.image || '')}&userRole=${user.role}&username=${encodeURIComponent(user.username || '')}&provider=github`
        : `${configService.get('FRONTEND_URL')}/login?action=success&accessToken=${accessToken}&userId=${user.id}&userEmail=${user.email}&userName=${encodeURIComponent(user.name || '')}&userImage=${encodeURIComponent(user.image || '')}&userRole=${user.role}&username=${encodeURIComponent(user.username || '')}&provider=github`;
      
      reply.redirect(redirectUrl);
    } catch (error: unknown) {
      if (error instanceof Error) {
        request.log.error('GitHub OAuth error:', error.message, error.stack);
      } else {
        request.log.error('GitHub OAuth error:', String(error));
      }
      reply.redirect(`${configService.get('FRONTEND_URL')}/login?error=OAuth%20Login%20Failed`);
    }
  });

  fastify.post('/register', async (request: FastifyRequest<{ Body: RegisterDto }>, reply: FastifyReply) => {
    const { access_token, user } = await authService.register(request.body);
    reply.setCookie('accessToken', access_token, {
      httpOnly: true,
      secure: configService.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/',
    });
    return { access_token, user };
  });

  fastify.post('/resend-verification', async (request: FastifyRequest<{ Body: { email: string } }>, reply: FastifyReply) => {
    return authService.resendVerification(request.body.email);
  });

  fastify.get('/verify-email', async (request: FastifyRequest<{ Querystring: VerifyEmailDto }>, reply: FastifyReply) => {
    return authService.verifyEmail(request.query.token);
  });

  fastify.post('/forgot-password', async (request: FastifyRequest<{ Body: ForgotPasswordDto }>, reply: FastifyReply) => {
    return authService.requestPasswordReset(request.body.email);
  });

  fastify.post('/reset-password', async (request: FastifyRequest<{ Body: ResetPasswordDto }>, reply: FastifyReply) => {
    return authService.resetPassword(request.body.token, request.body.newPassword);
  });

  fastify.get('/me', { preHandler: fastifyPassport.authenticate('jwt', { session: false }) }, async (request: FastifyRequest, reply: FastifyReply) => {
    return request.user;
  });
}

// JWT Strategy definition for Fastify Passport
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { PrismaService as AuthPrismaService } from '../prisma/prisma.service';

fastifyPassport.use('jwt', new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromExtractors([
    (req: any) => {
      // Check cookies for accessToken
      if (req?.cookies?.accessToken) {
        return req.cookies.accessToken;
      }
      // Check Authorization header for Bearer token
      const authHeader = req?.headers?.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
      }
      return null;
    },
  ]),
  secretOrKey: new ConfigService().get('JWT_SECRET'),
}, async (payload: any, done: Function) => {
  try {
    const prisma = new AuthPrismaService();
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone_number: true,
        createdAt: true,
        image: true,
        username: true,
      },
    });
    if (!user) {
      return done(null, false);
    }
    done(null, user);
  } catch (error) {
    done(error, false);
  }
}));
