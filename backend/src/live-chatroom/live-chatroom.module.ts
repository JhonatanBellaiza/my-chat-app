import { Module } from '@nestjs/common';
import { LiveChatroomResolver } from './live-chatroom.resolver';
import { LiveChatroomService } from './live-chatroom.service';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma.service';

@Module({
  providers: [LiveChatroomResolver, LiveChatroomService, UserService, JwtService, PrismaService]
})
export class LiveChatroomModule {}
