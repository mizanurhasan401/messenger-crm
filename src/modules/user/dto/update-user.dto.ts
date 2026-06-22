import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';
import { AppRole } from '../../../common/enums/role.enum';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Jane' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional()
  @IsUrl()
  @IsOptional()
  avatarUrl?: string;
}

export class UpdateUserRoleDto {
  @ApiPropertyOptional({ enum: AppRole, example: AppRole.MANAGER })
  @IsEnum(AppRole)
  role!: AppRole;
}
