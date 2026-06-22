import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

/** Payload pushed by the Chrome extension while browsing Messenger. */
export class ExtensionCustomerSyncDto {
  @ApiProperty({ example: 'fb_1001', description: 'Facebook user id (stable key)' })
  @IsString()
  facebookId!: string;

  @ApiProperty({ example: 'Jane B.' })
  @IsString()
  facebookName!: string;

  @ApiPropertyOptional({ example: 'https://facebook.com/jane' })
  @IsString()
  @IsOptional()
  profileUrl?: string;

  @ApiPropertyOptional({ example: 'Is this still available?' })
  @IsString()
  @IsOptional()
  lastMessage?: string;
}

export class ExtensionNoteDto {
  @ApiProperty({ example: 'fb_1001' })
  @IsString()
  facebookId!: string;

  @ApiProperty({ example: 'Customer asked about bulk pricing' })
  @IsString()
  content!: string;
}

export class ExtensionOrderDto {
  @ApiProperty({ example: 'fb_1001' })
  @IsString()
  facebookId!: string;

  @ApiProperty({ example: 'Premium Hoodie' })
  @IsString()
  productName!: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @ApiProperty({ example: 1200 })
  @IsNumber()
  @Min(0)
  amount!: number;
}
