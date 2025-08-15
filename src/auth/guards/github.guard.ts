// src/auth/guards/google.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext } from '@nestjs/common';

@Injectable()
export class GitHubAuthGuard extends AuthGuard('github') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: any) {
    if (err || !user) {
      throw err || new Error('Unauthorized');
    }
    return user;
  }
}
