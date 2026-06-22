import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { Throttle } from '@nestjs/throttler';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { AuthService, RequestMeta } from './auth.service';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  private meta(req: FastifyRequest): RequestMeta {
    return { ip: req.ip, userAgent: req.headers['user-agent'] };
  }

  @Public()
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ResponseMessage('Registration successful')
  @ApiOperation({ summary: 'Register a new organization + owner account' })
  register(@Body() dto: RegisterDto, @Req() req: FastifyRequest) {
    return this.auth.register(dto, this.meta(req));
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ResponseMessage('Login successful')
  @ApiOperation({ summary: 'Login with email + password' })
  login(@Body() dto: LoginDto, @Req() req: FastifyRequest) {
    return this.auth.login(dto, this.meta(req));
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Token refreshed')
  @ApiOperation({ summary: 'Rotate refresh token and obtain a new access token' })
  refresh(@Body() dto: RefreshTokenDto, @Req() req: FastifyRequest) {
    return this.auth.refresh(dto.refreshToken, this.meta(req));
  }

  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Logged out')
  @ApiOperation({ summary: 'Logout — revoke refresh token and blacklist access token' })
  async logout(@Body() dto: RefreshTokenDto, @CurrentUser() user: AuthUser) {
    await this.auth.logout(dto.refreshToken, user.jti);
    return null;
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ResponseMessage('If the email exists, a reset link has been sent')
  @ApiOperation({ summary: 'Request a password reset email' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.auth.forgotPassword(dto);
    return null;
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Password has been reset')
  @ApiOperation({ summary: 'Reset password using a reset token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.auth.resetPassword(dto);
    return null;
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Email verified')
  @ApiOperation({ summary: 'Verify email using a verification token' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    await this.auth.verifyEmail(dto);
    return null;
  }

  @ApiBearerAuth()
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Password changed')
  @ApiOperation({ summary: 'Change password (authenticated)' })
  async changePassword(@Body() dto: ChangePasswordDto, @CurrentUser('id') userId: string) {
    await this.auth.changePassword(userId, dto);
    return null;
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get the current authenticated user' })
  me(@CurrentUser('id') userId: string) {
    return this.auth.me(userId);
  }
}
