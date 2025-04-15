import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import { Module } from '@nestjs/common';
import { RocketsServerModule } from './rockets-server.module';
import { Entity } from 'typeorm';
import { UserSqliteEntity } from '@concepta/nestjs-user';
import { OtpSqliteEntity } from '@concepta/nestjs-otp';

// Create concrete entity implementations for TypeORM
@Entity()
class UserEntity extends UserSqliteEntity {}

@Entity()
class UserOtpEntity extends OtpSqliteEntity {
  // TypeORM needs this properly defined, but it's not used for swagger gen
  assignee: UserEntity;
}

/**
 * Generate Swagger documentation JSON file based on RocketsServer controllers
 */
async function generateSwaggerJson() {
  try {
    @Module({
      imports: [
        RocketsServerModule.forRoot({
          typeorm: {
            type: 'sqlite',
            database: ':memory:',
            synchronize: false,
            autoLoadEntities: true,
            // Register our entities
            entities: [UserEntity, UserOtpEntity],
          },
          jwt: {
            settings: {
              access: { secret: 'test-secret' },
              refresh: { secret: 'test-secret' },
              default: { secret: 'test-secret' },
            },
          },
          // The following is the minimum required by RocketsServerModule
          entities: {
            user: { entity: UserEntity },
            userOtp: { entity: UserOtpEntity },
          },

          services: {
            mailerService: {
              sendMail: () => Promise.resolve(),
            },
          },
        }),
      ],
    })
    class SwaggerAppModule {}

    // Create the app with SwaggerAppModule
    const app = await NestFactory.create(SwaggerAppModule, {
      logger: ['error'],
    });

    // Create Swagger document builder
    const options = new DocumentBuilder()
      .setTitle('Rockets API')
      .setDescription('API documentation for Rockets Server')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    // Create the swagger document using SwaggerModule
    const document = SwaggerModule.createDocument(app, options);

    // Create output directory
    const outputDir = path.resolve('./swagger');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write the document to a JSON file
    fs.writeFileSync(
      path.join(outputDir, 'swagger.json'),
      JSON.stringify(document, null, 2),
    );

    // Close the app to free resources
    await app.close();

    // console.debug(
    //   'Swagger JSON file generated successfully at swagger/swagger.json',
    // );
  } catch (error) {
    console.error('Error generating Swagger documentation:', error);
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the function if this file is executed directly
if (require.main === module) {
  generateSwaggerJson();
}

// Export the function for use in other modules
export { generateSwaggerJson };
