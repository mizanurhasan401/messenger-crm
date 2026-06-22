import { PartialType } from '@nestjs/swagger';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { CreateCustomerDto } from './create-customer.dto';

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {}

export class ChangeCustomerStatusDto {
  @ApiProperty({ enum: CustomerStatus })
  @IsEnum(CustomerStatus)
  status!: CustomerStatus;
}

export class AssignCustomerDto {
  @ApiPropertyOptional({ description: 'Agent user id, or null to unassign' })
  @IsUUID()
  @IsOptional()
  assignedToId?: string | null;
}
