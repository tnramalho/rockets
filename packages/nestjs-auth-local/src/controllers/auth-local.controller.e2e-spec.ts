import supertest from 'supertest';

import { INestApplication } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';

import { ExceptionsFilter } from '@concepta/nestjs-common';
import { PasswordValidationService } from '@concepta/nestjs-password';

import { AuthLocalInvalidCredentialsException } from '../exceptions/auth-local-invalid-credentials.exception';
import { AuthLocalValidateUserService } from '../services/auth-local-validate-user.service';

import { AppModuleDbFixture } from '../__fixtures__/app.module.fixture';
import { AuthLocalControllerFixture } from '../__fixtures__/auth-local.controller.fixture';
import { LOGIN_SUCCESS } from '../__fixtures__/user/constants';

describe('AuthLocalController (e2e)', () => {
  let app: INestApplication;
  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModuleDbFixture],
      controllers: [AuthLocalControllerFixture],
    })
      .overrideProvider(PasswordValidationService)
      .useValue({
        validate: () => {
          return true;
        },
      })
      .compile();
    app = moduleFixture.createNestApplication();

    const exceptionsFilter = app.get(HttpAdapterHost);
    app.useGlobalFilters(new ExceptionsFilter(exceptionsFilter));

    await app.init();
  });

  it('POST auth/login success', async () => {
    await supertest(app.getHttpServer())
      .post('/auth/login')
      .send(LOGIN_SUCCESS)
      .then((response) => {
        expect(response.body.accessToken).toBeDefined();
        expect(response.body.refreshToken).toBeDefined();
        expect(response.status).toBe(201);
      });
  });

  it('POST auth/login username not found ', async () => {
    await supertest(app.getHttpServer())
      .post('/auth/login')
      .send({
        ...LOGIN_SUCCESS,
        username: 'no_user',
      })
      .then((response) => {
        expect(response.body.message).toBe(
          'The provided username or password is incorrect. Please try again.',
        );
        expect(response.status).toBe(401);
      });
  });

  it('POST auth/login username not found with custom message', async () => {
    const validateUserService = app.get(AuthLocalValidateUserService);

    jest
      .spyOn(validateUserService, 'validateUser')
      .mockImplementationOnce(() => {
        throw new AuthLocalInvalidCredentialsException({
          safeMessage: 'Custom invalid credentials message',
        });
      });

    await supertest(app.getHttpServer())
      .post('/auth/login')
      .send({
        ...LOGIN_SUCCESS,
        username: 'no_user',
      })
      .then((response) => {
        expect(response.body.message).toBe(
          'Custom invalid credentials message',
        );
        expect(response.status).toBe(401);
      });
  });

  it('POST auth/login password fail ', async () => {
    await supertest(app.getHttpServer())
      .post('/auth/login')
      .send({
        ...LOGIN_SUCCESS,
        password: '',
      })
      .then((response) => {
        expect(response.body.message).toBe('Unauthorized');
        expect(response.status).toBe(401);
      });
  });

  it('POST auth/login username fail ', async () => {
    await supertest(app.getHttpServer())
      .post('/auth/login')
      .send({
        ...LOGIN_SUCCESS,
        username: '',
      })
      .then((response) => {
        expect(response.body.message).toBe('Unauthorized');
        expect(response.status).toBe(401);
      });
  });

  it('POST auth/login username fail ', async () => {
    await supertest(app.getHttpServer())
      .post('/auth/login')
      .send({
        ...LOGIN_SUCCESS,
        username: 999,
      })
      .then((response) => {
        expect(response.body.message).toBe(
          'The provided username or password is incorrect. Please try again.',
        );
        expect(response.status).toBe(400);
      });
  });

  it('POST auth/login password fail ', async () => {
    await supertest(app.getHttpServer())
      .post('/auth/login')
      .send({
        ...LOGIN_SUCCESS,
        password: 999,
      })
      .then((response) => {
        expect(response.body.message).toBe(
          'The provided username or password is incorrect. Please try again.',
        );
        expect(response.status).toBe(400);
      });
  });
});
