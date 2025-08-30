import { Controller, Post, Body, UseGuards, Request, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto';
import { LocalAuthGuard } from './guards/local-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'Login user with email and password' })
  @ApiBody({ 
    type: LoginDto,
    description: 'User login credentials',
    examples: {
      associate: {
        summary: 'Associate Login',
        value: { email: 'john.doe@company.com', password: 'password123' }
      },
      manager: {
        summary: 'Manager Login', 
        value: { email: 'jane.smith@company.com', password: 'password123' }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'User successfully logged in' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register new user account' })
  @ApiBody({ 
    type: RegisterDto,
    description: 'User registration data',
    examples: {
      associate: {
        summary: 'Register Associate',
        value: { 
          username: 'john.doe',
          email: 'john.doe@company.com', 
          password: 'password123',
          role: 'associate'
        }
      },
      manager: {
        summary: 'Register Manager',
        value: { 
          username: 'jane.smith',
          email: 'jane.smith@company.com', 
          password: 'password123',
          role: 'manager'
        }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body(ValidationPipe) registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }
}
