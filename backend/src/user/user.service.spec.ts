import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../prisma.service';
import * as fs from 'fs/promises';
import { NotFoundException } from '@nestjs/common';

describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateProfile', () => {
    it('should update profile and delete old avatar if avatarUrl is provided', async () => {
      const userId = 1;
      const fullname = 'John Doe';
      const avatarUrl = 'new-avatar-url';
      const oldUser = {
        id: userId,
        fullname: 'Old Name',
        avatarUrl: 'old-avatar-url',
        email: 'test@test.com',
        password: 'password',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const updatedUser = {
        id: userId,
        fullname,
        avatarUrl,
        email: 'test@test.com',
        password: 'password',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(oldUser);
      jest.spyOn(prisma.user, 'update').mockResolvedValue(updatedUser);
      jest.spyOn(fs, 'access').mockResolvedValue(undefined);
      jest.spyOn(fs, 'unlink').mockResolvedValue(undefined);

      const result = await service.updateProfile(userId, fullname, avatarUrl);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: userId } });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { fullname, avatarUrl },
      });
      expect(fs.unlink).toHaveBeenCalled();
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(service.updateProfile(1, 'John Doe', 'avatar-url')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('searchUsers', () => {
    it('should return users matching fullname and exclude current user', async () => {
      const users = [{
        id: 2,
        fullname: 'John Doe',
        avatarUrl: '',
        email: 'john@test.com',
        password: 'password',
        createdAt: new Date(),
        updatedAt: new Date()
      }];
      jest.spyOn(prisma.user, 'findMany').mockResolvedValue(users);

      const result = await service.searchUsers('John', 1);

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { fullname: { contains: 'John' }, id: { not: 1 } },
      });
      expect(result).toEqual(users);
    });
  });

  describe('getUser', () => {
    it('should return a user by id', async () => {
      const user = {
        id: 1,
        fullname: 'John Doe',
        avatarUrl: '',
        email: 'john@test.com',
        password: 'password',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(user);

      const result = await service.getUser(1);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(user);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(service.getUser(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUsersOfChatroom', () => {
    it('should return users of a chatroom ordered by createdAt', async () => {
      const users = [{
        id: 1,
        fullname: 'John Doe',
        avatarUrl: '',
        email: 'john@test.com',
        password: 'password',
        createdAt: new Date(),
        updatedAt: new Date()
      }];
      jest.spyOn(prisma.user, 'findMany').mockResolvedValue(users);

      const result = await service.getUsersOfChatroom(1);

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { chatrooms: { some: { id: 1 } } },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(users);
    });
  });

  describe('storeBase64ImageAndGetUrl', () => {
    it('should store a Base64 image and return its URL', async () => {
      const imageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...';
      const baseUrl = `${process.env.APP_URL}/images/`;
  
      jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
  
      const result = await service.storeBase64ImageAndGetUrl(imageBase64);
  
      // Check that the result starts with the base URL and ends with .png
      expect(result).toMatch(new RegExp(`^${baseUrl}.+\\.png$`));
      expect(fs.writeFile).toHaveBeenCalled();
    });
  });
});