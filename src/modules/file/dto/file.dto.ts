import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsString, Max, Min } from 'class-validator';

const ALLOWED_MIME = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
];

export class PresignUploadDto {
  @ApiProperty({ example: 'invoice.pdf' })
  @IsString()
  filename!: string;

  @ApiProperty({ enum: ALLOWED_MIME, example: 'application/pdf' })
  @IsIn(ALLOWED_MIME, { message: 'Unsupported file type' })
  contentType!: string;

  @ApiProperty({ example: 204800, description: 'File size in bytes (max 25MB)' })
  @IsInt()
  @Min(1)
  @Max(25 * 1024 * 1024)
  size!: number;
}

export class ConfirmUploadDto {
  @ApiProperty({ description: 'The object key returned by the presign step' })
  @IsString()
  key!: string;
}
