import { Resolver } from '@nestjs/graphql';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { User } from 'src/user/user.type';
import { LiveChatroomService } from './live-chatroom.service';
import { UserService } from 'src/user/user.service';
import { Subscription, Args, Context, Mutation } from '@nestjs/graphql';
import { Request } from 'express';
import { UseFilters, UseGuards, BadRequestException } from '@nestjs/common';
import { GraphqlAuthGuard } from 'src/auth/graphql-auth.guard';
import { GraphQLErrorFilter } from 'src/filters/custom-exception.filter';
@Resolver()
export class LiveChatroomResolver {
    public pubSub: RedisPubSub;
  constructor(
    private readonly liveChatroomService: LiveChatroomService,
    private readonly userService: UserService,
  ) {
    this.pubSub = new RedisPubSub();
  }

  @Subscription(() => [User], {
    nullable: true,
    resolve: (value) => value.liveUsers,
    filter: (payload, variables) => {
      return payload.chatroomId === variables.chatroomId;
    },
  })
  liveUsersInChatroom(@Args('chatroomId') chatroomId: number) {
    return this.pubSub.asyncIterator(`liveUsersInChatroom.${chatroomId}`);
  }

  @UseFilters(GraphQLErrorFilter)
  @UseGuards(GraphqlAuthGuard)
  @Mutation(() => Boolean)
  async enterChatroom(
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
    await this.liveChatroomService.addLiveUserToChatroom(chatroomId, user);
    const liveUsers = await this.liveChatroomService
      .getLiveUsersForChatroom(chatroomId)
      .catch((err) => {
        console.log('getLiveUsersForChatroom error', err);
      });

    await this.pubSub
      .publish(`liveUsersInChatroom.${chatroomId}`, {
        liveUsers,
        chatroomId,
      })
      .catch((err) => {
        console.log('pubSub error', err);
      });
    return true;
  }

  @UseFilters(GraphQLErrorFilter)
  @UseGuards(GraphqlAuthGuard)
  @Mutation(() => Boolean)
  async leaveChatroom(
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
    await this.liveChatroomService.removeLiveUserFromChatroom(chatroomId, user);
    const liveUsers = await this.liveChatroomService.getLiveUsersForChatroom(
      chatroomId,
    );
    await this.pubSub.publish(`liveUsersInChatroom.${chatroomId}`, {
      liveUsers,
      chatroomId,
    });

    return true;
  }
}