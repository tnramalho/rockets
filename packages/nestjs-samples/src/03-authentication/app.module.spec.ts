import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';
import { IssueTokenService } from '@concepta/nestjs-authentication';
import {
  AuthLocalUserModelService,
  AuthLocalUserModelServiceInterface,
} from '@concepta/nestjs-auth-local';

describe('AppModule', () => {
  it('should be imported', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const issueTokenService = module.get<IssueTokenService>(IssueTokenService);
    const userModelService = module.get<AuthLocalUserModelServiceInterface>(
      AuthLocalUserModelService,
    );

    expect(module).toBeInstanceOf(TestingModule);
    expect(issueTokenService).toBeInstanceOf(IssueTokenService);
    expect(userModelService).toBeInstanceOf(Object);

    await module.close();
  });
});
