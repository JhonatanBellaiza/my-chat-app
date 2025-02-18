import {
    Args,
    Context,
    Mutation,
    Query,
    Resolver,
    Subscription,
  } from '@nestjs/graphql';
  import { ChatroomService } from './chatroom.service';
  import { UserService } from 'src/user/user.service';
  import { GraphQLErrorFilter } from 'src/filters/custom-exception.filter';
  import { BadRequestException, UseFilters, UseGuards } from '@nestjs/common';
  import { GraphqlAuthGuard } from 'src/auth/graphql-auth.guard';
  import { Chatroom, Message } from './chatroom.types';
  import { Request } from 'express';
  import { RedisPubSub } from 'graphql-redis-subscriptions';
  import { User } from 'src/user/user.type';
  
  
  @Resolver()
  export class ChatroomResolver {
    public pubSub: RedisPubSub;
    constructor(
      private readonly chatroomService: ChatroomService,
      private readonly userService: UserService,
    ) {
        this.pubSub = new RedisPubSub();
    }
  
    @Subscription((returns) => Message, {
      nullable: true,
      resolve: (value) => value.newMessage,
    })
    newMessage(@Args('chatroomId') chatroomId: number) {
        console.log('newMessage', this.newMessage);
      return this.pubSub.asyncIterator(`newMessage.${chatroomId}`);
    }

    @Subscription(() => User, {
      nullable: true,
      resolve: (value) => value.user,
      filter: (payload, variables) => {
        console.log('payload1', variables, payload.typingUserId);
        return variables.userId !== payload.typingUserId;
      },
    })
    userStartedTyping(
      @Args('chatroomId') chatroomId: number,
      @Args('userId') userId: number,
    ) {
      return this.pubSub.asyncIterator(`userStartedTyping.${chatroomId}`);
    }
  
    @Subscription(() => User, {
      nullable: true,
      resolve: (value) => value.user,
      filter: (payload, variables) => {
        return variables.userId !== payload.typingUserId;
      },
    })
    userStoppedTyping(
      @Args('chatroomId') chatroomId: number,
      @Args('userId') userId: number,
    ) {
      return this.pubSub.asyncIterator(`userStoppedTyping.${chatroomId}`);
    }
  
    @UseFilters(GraphQLErrorFilter)
    @UseGuards(GraphqlAuthGuard)
    @Mutation((returns) => User)
    async userStartedTypingMutation(
      @Args('chatroomId') chatroomId: number,
      @Context() context: { req: Request },
    ) {
      const userId = context.req.user?.sub;
      if (!userId) {
        throw new BadRequestException('User not authenticated');
      }
      const user = await this.userService.getUser(userId);
      if (!user) {
        throw new BadRequestException('User not found');
      }
      await this.pubSub.publish(`userStartedTyping.${chatroomId}`, {
        user,
        typingUserId: user.id,
      });
      return user;
    }

    @UseFilters(GraphQLErrorFilter)
    @UseGuards(GraphqlAuthGuard)
    @Mutation(() => User, {})
    async userStoppedTypingMutation(
      @Args('chatroomId') chatroomId: number,
      @Context() context: { req: Request },
    ) {
      const userId = context.req.user?.sub;
      if (!userId) {
        throw new BadRequestException('User not authenticated');
      }
      const user = await this.userService.getUser(userId);
      if (!user) {
        throw new BadRequestException('User not found');
      }
      await this.pubSub.publish(`userStoppedTyping.${chatroomId}`, {
        user,
        typingUserId: user.id,
      });
      return user;
    }
  
    @UseGuards(GraphqlAuthGuard)
    @Mutation(() => Message)
    async sendMessage(
      @Args('chatroomId') chatroomId: number,
      @Args('content') content: string,
      @Context() context: { req: Request },
      @Args('imageBase64', { type: () => String, nullable: true })
      imageBase64?: string,
    ) {
      const userId = context.req.user?.sub;
      if (!userId) {
        throw new BadRequestException('User not authenticated');
      }
      let imageUrl = '';
      if (imageBase64) imageUrl = await this.userService.storeBase64ImageAndGetUrl(imageBase64);
      const newMessage = await this.chatroomService.sendMessage(
        chatroomId,
        content,
        context.req.user?.sub,
        imageUrl,
      );

      await this.pubSub
        .publish(`newMessage.${chatroomId}`, { newMessage })
        .then((res) => {
          console.log('published', newMessage.content);
        })
        .catch((err) => {
          console.log('err', err);
        });

        console.log('newMessage', this.pubSub.asyncIterator(`newMessage.${chatroomId}`));
        
      return newMessage;
    }
  
    @UseFilters(GraphQLErrorFilter)
    @UseGuards(GraphqlAuthGuard)
    @Mutation(() => Chatroom)
    async createChatroom(
      @Args('name') name: string,
      @Context() context: { req: Request },
    ) {
      const userId = context.req.user?.sub;
      if (!userId) {
        throw new BadRequestException('User not authenticated');
      }
      return this.chatroomService.createChatroom(name, userId);
    }
  
    @Mutation(() => Chatroom)
    async addUsersToChatroom(
      @Args('chatroomId') chatroomId: number,
      @Args('userIds', { type: () => [Number] }) userIds: number[],
    ) {
      return this.chatroomService.addUsersToChatroom(chatroomId, userIds);
    }
  
    @Query(() => [Chatroom])
    async getChatroomsForUser(@Args('userId') userId: number) {
      return this.chatroomService.getChatroomsForUser(userId);
    }
  
    @Query(() => [Message])
    async getMessagesForChatroom(@Args('chatroomId') chatroomId: number) {
      return this.chatroomService.getMessagesForChatroom(chatroomId);
    }
    @Mutation(() => String)
    async deleteChatroom(@Args('chatroomId') chatroomId: number) {
      await this.chatroomService.deleteChatroom(chatroomId);
      return 'Chatroom deleted successfully';
    }
  }