import { Injectable, UnauthorizedException, ConflictException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import { DATABASE_CONNECTION } from '../../database/database.module';
import { users, insertUserSchema, User, UserRole } from '../../database/schema';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  username: string;
  email: string;
  password: string;
  role?: UserRole;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: any,
    private jwtService: JwtService,
  ) {}

  /**
   * Validate user credentials for login
   */
  async validateUser(email: string, password: string): Promise<Omit<User, 'password'> | null> {
    try {
      const [user] = await this.db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (user && await bcrypt.compare(password, user.password)) {
        const { password: _, ...result } = user;
        return result;
      }
      return null;
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  /**
   * Login user and return JWT token
   */
  async login(user: Omit<User, 'password'>) {
    const payload = { 
      email: user.email, 
      sub: user.id, 
      role: user.role,
      username: user.username 
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  }

  /**
   * Register new user
   */
  async register(registerDto: RegisterDto) {
    try {
      // Validate input
      const validatedData = insertUserSchema.parse(registerDto);
      
      // Check if user already exists
      const existingUser = await this.findByEmailOrUsername(
        validatedData.email, 
        validatedData.username
      );
      
      if (existingUser) {
        throw new ConflictException('User with this email or username already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 12);
      
      // Create user
      const [newUser] = await this.db
        .insert(users)
        .values({
          ...validatedData,
          password: hashedPassword,
        })
        .returning();

      const { password: _, ...result } = newUser;
      return result;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new ConflictException('Failed to create user');
    }
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    try {
      const [user] = await this.db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      
      return user || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const [user] = await this.db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      
      return user || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Find user by email or username
   */
  private async findByEmailOrUsername(email: string, username: string): Promise<User | null> {
    try {
      const [user] = await this.db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .union(
          this.db
            .select()
            .from(users)
            .where(eq(users.username, username))
        )
        .limit(1);
      
      return user || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Validate JWT payload
   */
  async validateJwtPayload(payload: any): Promise<Omit<User, 'password'> | null> {
    const user = await this.findById(payload.sub);
    if (user) {
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }
}
