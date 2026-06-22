import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsHexColor, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateTagDto {
  @ApiProperty({ example: 'VIP' })
  @IsString()
  @MaxLength(60)
  name!: string;

  @ApiPropertyOptional({ example: '#f59e0b', default: '#6366f1' })
  @IsHexColor()
  @IsOptional()
  color?: string;
}

export class UpdateTagDto {
  @ApiPropertyOptional({ example: 'VIP' })
  @IsString()
  @IsOptional()
  @MaxLength(60)
  name?: string;

  @ApiPropertyOptional({ example: '#f59e0b' })
  @IsHexColor()
  @IsOptional()
  color?: string;
}

export class AttachTagDto {
  @ApiProperty({ description: 'Customer id to attach/detach the tag' })
  @IsUUID()
  customerId!: string;
}
