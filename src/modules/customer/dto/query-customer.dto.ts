import { ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class QueryCustomerDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: CustomerStatus })
  @IsEnum(CustomerStatus)
  @IsOptional()
  status?: CustomerStatus;

  @ApiPropertyOptional({ description: 'Filter by assigned agent id' })
  @IsUUID()
  @IsOptional()
  assignedToId?: string;

  @ApiPropertyOptional({ description: 'Filter by source' })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiPropertyOptional({ description: 'Filter by tag id' })
  @IsUUID()
  @IsOptional()
  tagId?: string;
}
