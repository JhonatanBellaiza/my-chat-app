import { Test, TestingModule } from '@nestjs/testing';
import { TokenService } from './token.service';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { verify } from 'jsonwebtoken';

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

describe('TokenService', () => {
  let service: TokenService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('extractToken', () => {
    it('should return the token if it exists in connectionParams', () => {
      const connectionParams = { token: 'valid-token' };
      const result = service.extractToken(connectionParams);
      expect(result).toBe('valid-token');
    });

    it('should return undefined if connectionParams is empty', () => {
      const result = service.extractToken(null);
      expect(result).toBeUndefined();
    });

    it('should return undefined if token is not in connectionParams', () => {
      const connectionParams = { otherKey: 'value' };
      const result = service.extractToken(connectionParams);
      expect(result).toBeUndefined();
    });
  });

  describe('validateToken', () => {
    it('should return the decoded token if the token is valid', () => {
      const token = 'valid-token';
      const decodedToken = { userId: 1 };
      const refreshSecretToken = 'secret';

      jest.spyOn(configService, 'get').mockReturnValue(refreshSecretToken);
      (verify as jest.Mock).mockReturnValue(decodedToken);

      const result = service.validateToken(token);

      expect(configService.get).toHaveBeenCalledWith('REFRESH_SECRET_TOKEN');
      expect(verify).toHaveBeenCalledWith(token, refreshSecretToken);
      expect(result).toEqual(decodedToken);
    });

    it('should throw an error if REFRESH_SECRET_TOKEN is not defined', () => {
      jest.spyOn(configService, 'get').mockReturnValue(undefined);

      expect(() => service.validateToken('valid-token')).toThrow(
        'REFRESH_SECRET_TOKEN is not defined',
      );
    });

    it('should throw UnauthorizedException if the token is invalid', () => {
      const token = '';
      const refreshSecretToken = '';

      jest.spyOn(configService, 'get').mockReturnValue(refreshSecretToken);
      (verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => service.validateToken(token)).toThrow(UnauthorizedException);
    });
  });
});