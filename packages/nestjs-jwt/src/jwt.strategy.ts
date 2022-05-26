import { Strategy as PassportStrategy } from 'passport-strategy';
import { Strategy, VerifyCallback } from 'passport-jwt';
import { JwtStrategyOptionsInterface } from './interfaces/jwt-strategy-options.interface';

export class JwtStrategy extends PassportStrategy {
  constructor(
    private options: JwtStrategyOptionsInterface,
    private verify: VerifyCallback,
  ) {
    super();

    this.options = options;
    this.verify = verify;
  }

  authenticate(...args: Parameters<Strategy['authenticate']>) {
    const [req] = args;

    const rawToken = this.options.jwtFromRequest(req);

    if (!rawToken) {
      return this.fail('Missing authorization token', 401);
    }

    try {
      return this.options.verifyToken(
        rawToken,
        this.verifyTokenCallback.bind(this),
      );
    } catch (e) {
      return this.error(e);
    }
  }

  private verifyTokenCallback(e: Error, decodedToken: Record<string, unknown>) {
    if (e) {
      return this.error(e);
    }

    try {
      return this.verify(decodedToken, this.isVerifiedCallback.bind(this));
    } catch (e) {
      return this.error(e);
    }
  }

  private isVerifiedCallback(error: Error, user: unknown, info: unknown) {
    if (error) {
      return this.error(error);
    } else if (!user) {
      return this.fail(info, 401);
    } else {
      return this.success(user, info);
    }
  }
}