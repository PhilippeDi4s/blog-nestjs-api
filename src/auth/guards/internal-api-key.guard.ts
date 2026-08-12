import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    const apiKey = request.headers['x-internal-api-key'];

    if (apiKey !== process.env.INTERNAL_API_KEY) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
