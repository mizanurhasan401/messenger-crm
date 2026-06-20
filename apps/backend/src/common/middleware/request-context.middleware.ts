import { Injectable, NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import { tenantStorage } from "../context/tenant-context";

/**
 * Establishes an empty ALS store for the request so guards (which run later in
 * the same async chain) can populate userId/orgId/role, and repositories can
 * read them. Must be applied before the global guards.
 */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(_req: Request, _res: Response, next: NextFunction): void {
    tenantStorage.run({}, () => next());
  }
}
