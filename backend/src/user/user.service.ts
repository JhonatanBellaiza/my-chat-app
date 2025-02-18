import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as fs from 'fs/promises'; // Use promises for async file operations
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProfile(userId: number, fullname: string, avatarUrl: string) {
    const oldUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!oldUser) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { fullname, avatarUrl },
    });

    if (oldUser.avatarUrl) {
      const imageName = oldUser.avatarUrl.split('/').pop() || '';
      const imagePath = join(process.cwd(), 'public', 'images', imageName);

      try {
        await fs.access(imagePath); // Check if file exists
        await fs.unlink(imagePath); // Delete old avatar file
      } catch (error) {
        console.error('Failed to delete old avatar:', error);
      }
    }

    return updatedUser;
  }

  async searchUsers(fullname: string, userId: number) {
    return this.prisma.user.findMany({
      where: {
        fullname: { contains: fullname },
        id: { not: userId },
      },
    });
  }

  async getUser(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getUsersOfChatroom(chatroomId: number) {
    return this.prisma.user.findMany({
      where: {
        chatrooms: { some: { id: chatroomId } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async storeBase64ImageAndGetUrl(imageBase64: string) {
    const uniqueFilename = `${uuidv4()}.png`; // Assuming PNG format
    const imagePath = join(process.cwd(), 'public', 'images', uniqueFilename);
    const imageUrl = `${process.env.APP_URL}/images/${uniqueFilename}`;

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    await fs.writeFile(imagePath, buffer); // Write file asynchronously

    return imageUrl;
  }
}