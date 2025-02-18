import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { LoginDto, RegisterDto } from './dto';
import { Request } from 'express';
import { Response } from 'express';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let prisma: PrismaService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    prisma = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('refreshToken', () => {
    it('should return a new access token if refresh token is valid', async () => {
      const refreshToken = 'valid-refresh-token';
      const payload = { sub: 1, username: 'test@example.com' };
      const user = { 
        id: 1, 
        email: 'test@example.com',
        fullname: 'Test User',
        password: 'hashed-password',
        avatarUrl: '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      jest.spyOn(jwtService, 'verify').mockReturnValue(payload);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(user);
      jest.spyOn(jwtService, 'sign').mockReturnValue('new-access-token');

      const req = { cookies: { refresh_token: refreshToken } } as Request;
      const res = { cookie: jest.fn() } as unknown as Response;

      const result = await service.refreshToken(req, res);

      expect(result).toBe('new-access-token');
      expect(jwtService.verify).toHaveBeenCalledWith(refreshToken, {
        secret: configService.get('REFRESH_TOKEN_SECRET'),
      });
      expect(res.cookie).toHaveBeenCalledWith('access_token', 'new-access-token', { httpOnly: true });
    });

    it('should throw UnauthorizedException if refresh token is missing', async () => {
      const req = { cookies: {} } as unknown as Request;
      const res = {} as Response;

      await expect(service.refreshToken(req, res)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      const refreshToken = 'invalid-refresh-token';

      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const req = { cookies: { refresh_token: refreshToken } } as unknown as Request;
      const res = {} as Response;

      await expect(service.refreshToken(req, res)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateUser', () => {
    it('should return the user if credentials are valid', async () => {
      const loginDto: LoginDto = { email: 'test@example.com', password: 'password' };
      const user = { 
        id: 1, 
        email: 'test@example.com',
        fullname: 'Test User',
        password: 'hashed-password',
        avatarUrl: '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const result = await service.validateUser(loginDto);
      expect(result).toEqual(user);
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      const loginDto: LoginDto = { email: 'test@example.com', password: 'password' };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(service.validateUser(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const loginDto: LoginDto = { email: 'test@example.com', password: 'password' };
      const user = { 
        id: 1, 
        email: 'test@example.com',
        fullname: 'Test User',
        password: 'hashed-password',
        avatarUrl: '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      await expect(service.validateUser(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should create a new user and return tokens', async () => {
      const registerDto: RegisterDto = {
        fullname: 'Test User',
        email: 'test@example.com',
        password: 'password',
        confirmPassword: 'password'
      };
      const user = { 
        id: 1, 
        ...registerDto,
        password: 'hashed-password',
        avatarUrl: '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password');
      jest.spyOn(prisma.user, 'create').mockResolvedValue(user);
      
      const response = { cookie: jest.fn() } as unknown as Response;

      const result = await service.register(registerDto, response);
      expect(result).toEqual({ user });
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          fullname: registerDto.fullname,
          email: registerDto.email,
          password: 'hashed-password',
        }),
      });
    });

    it('should throw BadRequestException if user already exists', async () => {
      const registerDto: RegisterDto = {
        fullname: 'Test User',
        email: 'test@example.com',
        password: 'password',
        confirmPassword: 'password'
      };
      const existingUser = { 
        id: 1, 
        ...registerDto,
        password: 'hashed-password',
        avatarUrl: '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(existingUser);

      const response = {} as Response;

      await expect(service.register(registerDto, response)).rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    it('should return tokens if credentials are valid', async () => {
      const loginDto: LoginDto = { email: 'test@example.com', password: 'password' };
      const user = { 
        id: 1, 
        email: 'test@example.com',
        fullname: 'Test User',
        password: 'hashed-password',
        avatarUrl: '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      jest.spyOn(service, 'validateUser').mockResolvedValue(user);
      
      const response = { cookie: jest.fn() } as unknown as Response;

      const result = await service.login(loginDto, response);
      expect(result).toEqual({ user });
    });

    it('should throw BadRequestException if credentials are invalid', async () => {
      const loginDto: LoginDto = { email: 'test@example.com', password: 'password' };

      jest.spyOn(service, 'validateUser').mockRejectedValue(new BadRequestException());

      const response = {} as Response;

      await expect(service.login(loginDto, response)).rejects.toThrow(BadRequestException);
    });
  });

  describe('logout', () => {
    it('should clear cookies and return success message', async () => {
      const response = { clearCookie: jest.fn() } as unknown as Response;

      const result = await service.logout(response);
      expect(result).toBe('Logged out successfully');
      expect(response.clearCookie).toHaveBeenCalledWith('access_token');
      expect(response.clearCookie).toHaveBeenCalledWith('refresh_token');
    });
  });
});