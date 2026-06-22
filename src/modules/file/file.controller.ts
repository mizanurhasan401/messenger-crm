import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { ConfirmUploadDto, PresignUploadDto } from './dto/file.dto';
import { FileService } from './file.service';

@ApiTags('Files')
@ApiBearerAuth()
@Controller('files')
export class FileController {
  constructor(private readonly files: FileService) {}

  @Post('presign')
  @ResponseMessage('Presigned upload URL generated')
  @ApiOperation({ summary: 'Get a presigned URL to upload a file to R2' })
  presign(@Body() dto: PresignUploadDto) {
    return this.files.presignUpload(dto);
  }

  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Upload confirmed')
  @ApiOperation({ summary: 'Confirm an upload completed' })
  confirm(@Body() dto: ConfirmUploadDto) {
    return this.files.confirmUpload(dto);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Get a presigned download URL' })
  download(@Param('id', ParseUUIDPipe) id: string) {
    return this.files.getDownloadUrl(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('File deleted')
  @ApiOperation({ summary: 'Delete a file' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.files.remove(id);
    return null;
  }
}
