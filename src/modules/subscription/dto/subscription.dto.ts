import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionPlan } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateSubscriptionDto {
  @ApiProperty({ enum: SubscriptionPlan })
  @IsEnum(SubscriptionPlan)
  plan!: SubscriptionPlan;

  @ApiPropertyOptional({ example: 10, description: 'Number of seats' })
  @IsInt()
  @Min(1)
  @IsOptional()
  seats?: number;
}
