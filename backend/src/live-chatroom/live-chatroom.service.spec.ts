import { Test, TestingModule } from '@nestjs/testing';
import { ChatroomService } from '../chatroom/chatroom.service';
import { PrismaService } from '../prisma.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import * as fs from 'fs';

// Mock the fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  createWriteStream: jest.fn(() => ({
    on: jest.fn().mockImplementation((event, callback) => {
      if (event === 'finish') callback();
    }),
  })),
}));

describe('ChatroomService', () => {
  let service: ChatroomService;
  let prisma: PrismaService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatroomService,
        {
          provide: PrismaService,
          useValue: {
            chatroom: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              findMany: jest.fn(),
              delete: jest.fn(),
            },
            message: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ChatroomService>(ChatroomService);
    prisma = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getChatroom', () => {
    it('should return a chatroom by ID', async () => {
      const chatroom = {
        id: 1,
        name: 'Test Chatroom',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      jest.spyOn(prisma.chatroom, 'findUnique').mockResolvedValue(chatroom);

      const result = await service.getChatroom('1');
      expect(result).toEqual(chatroom);
      expect(prisma.chatroom.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw BadRequestException for invalid chatroom ID', async () => {
      await expect(service.getChatroom('invalid')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('createChatroom', () => {
    it('should create a new chatroom', async () => {
      const chatroom = {
        id: 1,
        name: 'Test Chatroom',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      jest.spyOn(prisma.chatroom, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.chatroom, 'create').mockResolvedValue(chatroom);

      const result = await service.createChatroom('Test Chatroom', 1);
      expect(result).toEqual(chatroom);
      expect(prisma.chatroom.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Chatroom',
          users: { connect: { id: 1 } },
        },
      });
    });

    it('should throw BadRequestException if chatroom already exists', async () => {
      const chatroom = {
        id: 1,
        name: 'Test Chatroom',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      jest.spyOn(prisma.chatroom, 'findFirst').mockResolvedValue(chatroom);

      await expect(service.createChatroom('Test Chatroom', 1)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('addUsersToChatroom', () => {
    it('should add users to a chatroom', async () => {
      const chatroom = {
        id: 1,
        name: 'Test Chatroom',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      jest.spyOn(prisma.chatroom, 'findUnique').mockResolvedValue(chatroom);
      jest.spyOn(prisma.chatroom, 'update').mockResolvedValue(chatroom);

      const result = await service.addUsersToChatroom(1, [2, 3]);
      expect(result).toEqual(chatroom);
      expect(prisma.chatroom.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          users: { connect: [{ id: 2 }, { id: 3 }] },
        },
        include: { users: true },
      });
    });

    it('should throw BadRequestException if chatroom does not exist', async () => {
      jest.spyOn(prisma.chatroom, 'findUnique').mockResolvedValue(null);

      await expect(service.addUsersToChatroom(1, [2, 3])).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('saveImage', () => {
    it('should save an image and return the path', async () => {
      const image = {
        createReadStream: () => ({
          pipe: jest.fn(),
          on: jest.fn((event, callback) => {
            if (event === 'end') callback();
          }),
        }),
        filename: 'test.png',
        mimetype: 'image/png',
      };
      jest.spyOn(configService, 'get').mockReturnValue('/images');

      const result = await service.saveImage(image);
      expect(result).toContain('/images');
      expect(fs.createWriteStream).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid image type', async () => {
      const image = {
        createReadStream: () => ({ pipe: jest.fn() }),
        filename: 'test.txt',
        mimetype: 'text/plain',
      };

      await expect(service.saveImage(image)).rejects.toThrow(BadRequestException);
    });
  });
});