import { Global, Module } from '@nestjs/common';
import { TenantContext } from './context/tenant-context.service';

/**
 * Global module exposing cross-cutting, request-aware providers so feature
 * modules can inject them without re-declaring providers everywhere.
 */
@Global()
@Module({
  providers: [TenantContext],
  exports: [TenantContext],
})
export class CommonModule {}
