import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { PaginationMetaDto } from '../dto/api-response.dto';

/**
 * Documents a paginated list endpoint in Swagger using the standard response
 * envelope produced by ResponseInterceptor:
 *
 *   { success, message, data: Model[], meta: PaginationMetaDto }
 *
 * Pass the entity model to render each item's schema; omit it for a generic
 * array of objects.
 */
export function ApiPaginatedResponse(model?: Type<unknown>) {
  const dataSchema = model
    ? { type: 'array', items: { $ref: getSchemaPath(model) } }
    : { type: 'array', items: { type: 'object' } };

  return applyDecorators(
    ApiExtraModels(PaginationMetaDto, ...(model ? [model] : [])),
    ApiOkResponse({
      schema: {
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Success' },
          data: dataSchema,
          meta: { $ref: getSchemaPath(PaginationMetaDto) },
        },
      },
    }),
  );
}
