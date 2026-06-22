import { ApiProperty } from '@nestjs/swagger';

/** Swagger documentation models for the standard response envelopes. */
export class ApiSuccessDto<T = unknown> {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Success' })
  message!: string;

  @ApiProperty()
  data!: T;
}

export class ApiErrorDto {
  @ApiProperty({ example: false })
  success!: boolean;

  @ApiProperty({ example: 'Error message' })
  message!: string;

  @ApiProperty({ example: [], type: [String] })
  errors!: unknown[];
}

export class PaginationMetaDto {
  @ApiProperty({ example: 100 }) total!: number;
  @ApiProperty({ example: 1 }) page!: number;
  @ApiProperty({ example: 20 }) limit!: number;
  @ApiProperty({ example: 5 }) totalPages!: number;
  @ApiProperty({ example: true }) hasNextPage!: boolean;
  @ApiProperty({ example: false }) hasPrevPage!: boolean;
}
