import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { GraphQLISODateTime, GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver } from '@nestjs/apollo';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { TokenService } from './token/token.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ChatroomModule } from './chatroom/chatroom.module';
import { LiveChatroomModule } from './live-chatroom/live-chatroom.module';

const pubSub = new RedisPubSub({
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    retryStrategy: (times) => {
      return Math.min(times * 50, 2000);
    },
  },
});

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/',
    }),
    // Import authentication and user-related modules
    AuthModule, 
    UserModule,

    // Configuring GraphQL with Apollo Driver
    GraphQLModule.forRootAsync({
      imports: [ConfigModule, AppModule], // Importing configuration and app modules
      inject: [ConfigService], // Injecting ConfigService for environment variables
      driver: ApolloDriver, // Using Apollo GraphQL driver
      useFactory: async (configService: ConfigService, tokenService: TokenService) => {
        return {
          installSubscriptionHandlers: true,
          playground: true, // Enables GraphQL Playground for API testing
          autoSchemaFile: join(process.cwd(), 'src/schema.gql'), // Auto-generates schema file
          uploads: false,
          sortSchema: true, // Sorts schema fields alphabetically for consistency
          subscriptions: {
            'graphql-ws': true,
            'subscriptions-transport-ws': true,
          },
          resolvers: {
            DateTime: GraphQLISODateTime,
          },
          onConnect: (connectionParams) => {
            const token = tokenService.extractToken(connectionParams);
            if(!token) {
              throw new Error('No token provided');
            }
            const user = tokenService.validateToken(token);
            if(!user) {
              throw new Error('Invalid token');
            }
            return { user };
          },
          context: ({ req, res, connection }) => { 
            if(connection) {
              return {
                req,
                res,
                user: connection.context.user,
                pubSub
              }
            }
            return {req, res}
          },
        };
      },
    }),
    // Loading environment variables globally
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigModule available throughout the app
    }),

    ChatroomModule,

    LiveChatroomModule,
  ],
  

  // Registering providers (services) for dependency injection
  providers: [AppService, TokenService],
})
export class AppModule {}
