import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Lightweight auth for the Chrome Extension endpoints. The extension sends
 * a per-organization API key in a header; we resolve the org from it.
 *
 * NOTE: this is a scaffold — in production resolve the key against a
 * persisted, hashed `api_keys` table rather than a static value, and set
 * request.user.organizationId from the matched record.
 */
@Injectable()
export class ExtensionApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const headerName = this.config.get<string>('extension.apiKeyHeader')!;
    const request = context.switchToHttp().getRequest();
    const key = request.headers?.[headerName];

    if (!key) {
      throw new UnauthorizedException('Missing extension API key');
    }
    // Attach for downstream resolution by ExtensionService.
    request.extensionApiKey = key;
    return true;
  }
}
