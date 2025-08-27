import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { CreateJwtUserDto } from '../dto/auth.dto'; 

export const CurrentUser = createParamDecorator(
  (data: keyof CreateJwtUserDto | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CreateJwtUserDto; // Cast to your CreateJwtUserDto

    return data ? user?.[data] : user;
  },
);
