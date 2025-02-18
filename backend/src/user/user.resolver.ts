import { Resolver, Query, Context, Mutation, Args } from '@nestjs/graphql';
import { UserService } from './user.service';
import { User } from './user.type';
import { Request } from 'express';
import { UseGuards } from '@nestjs/common';
import { GraphqlAuthGuard } from 'src/auth/graphql-auth.guard';

import GraphQLUpload from 'graphql-upload/GraphQLUpload.mjs';
import type Upload from 'graphql-upload/Upload.mjs';

@Resolver()
export class UserResolver {
  constructor(private readonly userService: UserService) { }

  @UseGuards(GraphqlAuthGuard)
  @Mutation(() => User)
  async updateProfile(
    @Args('fullname') fullname: string,
    @Args('imageBase64', { type: () => String, nullable: true })
    imageBase64: string,
    @Context() context: { req: Request },
  ) {
    const userId = context.req.user?.sub;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    let imageUrl = '';
    if (imageBase64) {
      imageUrl = await this.userService.storeBase64ImageAndGetUrl(imageBase64);
    }

    return this.userService.updateProfile(userId, fullname, imageUrl);
  }

  @UseGuards(GraphqlAuthGuard)
  @Query(() => [User])
  async searchUsers(
    @Args('fullname') fullname: string,
    @Context() context: { req: Request },
  ) {
    const userId = context.req.user?.sub;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return this.userService.searchUsers(fullname, userId);
  }

  @UseGuards(GraphqlAuthGuard)
  @Query(() => [User])
  getUsersOfChatroom(@Args('chatroomId') chatroomId: number) {
    return this.userService.getUsersOfChatroom(chatroomId);
  }
}