import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateNoteDto {
  @ApiProperty({ description: 'Customer the note belongs to' })
  @IsUUID()
  customerId!: string;

  @ApiProperty({ example: 'Called customer, will decide tomorrow.' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;
}

export class UpdateNoteDto {
  @ApiProperty({ example: 'Updated note text' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;
}
