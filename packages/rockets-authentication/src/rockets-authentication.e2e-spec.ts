import { INestApplication, Module, Controller, Get, UseGuards } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { RocketsAuthenticationModule } from './rockets-authentication.module';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@concepta/nestjs-jwt';
import { AuthJwtGuard } from '@concepta/nestjs-auth-jwt';

// Test controller with protected route
@Controller('test')
@UseGuards(AuthJwtGuard)
export class TestController {
  @Get('protected')
  async getProtected(): Promise<{ message: string }> {
    return { message: 'This is a protected route' };
  }
}

// Mock user lookup service
const mockUserLookupService = {
  byId: jest.fn().mockResolvedValue({ id: '1', username: 'test' }),
  bySubject: jest.fn().mockResolvedValue({ id: '1', username: 'test' }),
  byUsername: jest.fn().mockResolvedValue({ id: '1', username: 'test' }),
  byEmail: jest.fn().mockResolvedValue({ id: '1', username: 'test' }),
};

// Mock configuration module
@Module({
  providers: [
    {
      provide: ConfigService,
      useValue: {
        get: jest.fn().mockImplementation((key) => {
          if (key === 'jwt.secret') return 'test-secret';
          if (key === 'jwt.expiresIn') return '1h';
          return null;
        }),
      },
    },
  ],
  exports: [ConfigService],
})
class MockConfigModule {}

describe('RocketsAuthentication (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        MockConfigModule,
        RocketsAuthenticationModule.forRoot({
          jwt: {
            settings: {
              access: { secret: 'test-secret' },
              default: { secret: 'test-secret' },
              refresh: { secret: 'test-secret' },
            },
          },
          services: {
            userLookupService: mockUserLookupService,
          },
        }),
      ],
      controllers: [TestController],
    }).compile();

    app = moduleFixture.createNestApplication();
    jwtService = moduleFixture.get<JwtService>(JwtService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    // Reset mock implementations before each test
    jest.clearAllMocks();
  });

  describe('Authentication Flow', () => {
    it('should access protected route with valid token', async () => {
      // Create a test token
      const token = await jwtService.signAsync(
        { sub: '1', username: 'test' },
        { secret: 'test-secret' },
      );

      // Make request with token
      const response = await request(app.getHttpServer())
        .get('/test/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual({
        message: 'This is a protected route',
      });
    });

    it('should reject access to protected route without token', async () => {
      await request(app.getHttpServer())
        .get('/test/protected')
        .expect(401);
    });

    it('should reject access to protected route with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/test/protected')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

  });
}); 