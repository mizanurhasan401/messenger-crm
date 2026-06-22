import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerStatus } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Jane Buyer' })
  @IsString()
  @MaxLength(160)
  name!: string;

  @ApiPropertyOptional({ example: 'Jane B.' })
  @IsString()
  @IsOptional()
  facebookName?: string;

  @ApiPropertyOptional({ example: 'fb_1001' })
  @IsString()
  @IsOptional()
  facebookId?: string;

  @ApiPropertyOptional({ example: 'https://facebook.com/jane' })
  @IsString()
  @IsOptional()
  profileUrl?: string;

  @ApiPropertyOptional({ example: '+8801700000000' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'jane@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ enum: CustomerStatus, default: CustomerStatus.NEW })
  @IsEnum(CustomerStatus)
  @IsOptional()
  status?: CustomerStatus;

  @ApiPropertyOptional({ example: 'messenger' })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiPropertyOptional({ description: 'Agent (user) id to assign' })
  @IsUUID()
  @IsOptional()
  assignedToId?: string;
}
