import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import graphqlUploadExpress from "graphql-upload/graphqlUploadExpress.mjs";
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  // Creating the NestJS application instance
  const app = await NestFactory.create(AppModule);

  // Enabling CORS (Cross-Origin Resource Sharing) to allow frontend requests
  app.enableCors({
    origin: 'http://localhost:5173', // Allowed origin for requests
    credentials: true, // Allows cookies and authentication headers
    allowedHeaders: [
      'Accept',
      'Authorization',
      'Content-type',
      'X-Requested-With',
      'apollo-require-preflight' // Custom Apollo GraphQL header
    ],
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'], // Allowed HTTP methods
  });

  // Middleware to parse incoming cookies
  app.use(cookieParser());

  // Middleware to handle file uploads in GraphQL (e.g., images)
  app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 1 }));

  // Global validation pipe to validate incoming requests
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips out any properties not defined in DTOs
      transform: true, // Automatically transforms request payloads into DTOs
      exceptionFactory: (errors) => {
        // Custom error formatting
        const formattedErrors = errors.reduce((acumulator, error) => {
          acumulator[error.property] = error.constraints
            ? Object.values(error.constraints).join(', ')
            : 'Unknown validation error'; // Provide a fallback message
          return acumulator;
        }, {});
      
        throw new BadRequestException(formattedErrors);
      },
    }),
  );
  // Increase payload size limit (e.g., 50MB)
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
