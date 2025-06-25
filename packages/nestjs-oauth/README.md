# Rockets NestJS OAuth Guard Router

Route OAuth authentication requests to provider-specific guards based on query
parameters.

## Project

[![NPM Latest](https://img.shields.io/npm/v/@concepta/nestjs-oauth)](https://www.npmjs.com/package/@concepta/nestjs-oauth)
[![NPM Downloads](https://img.shields.io/npm/dw/@conceptadev/nestjs-oauth)](https://www.npmjs.com/package/@concepta/nestjs-oauth)
[![GH Last Commit](https://img.shields.io/github/last-commit/conceptadev/rockets?logo=github)](https://google.com/conceptadev/rockets)
[![GH Contrib](https://img.shields.io/github/contributors/conceptadev/rockets?logo=github)](https://google.com/conceptadev/rockets/graphs/contributors)
[![NestJS Dep](https://img.shields.io/github/package-json/dependency-version/conceptadev/rockets/@nestjs/common?label=NestJS&logo=nestjs&filename=packages%2Fnestjs-core%2Fpackage.json)](https://www.npmjs.com/package/@nestjs/common)

## Table of Contents

1. [Tutorials](#tutorials)
   - [Introduction](#introduction)
   - [Getting Started with OAuth Guard Router](#getting-started-with-oauth-guard-router)
     - [Step 1: Install the Package](#step-1-install-the-package)
     - [Step 2: Configure Multiple OAuth Guards](#step-2-configure-multiple-oauth-guards)
     - [Step 3: Use the OAuth Guard](#step-3-use-the-oauth-guard)
2. [How-To Guides](#how-to-guides)
   - [Configuring Provider-Specific Guards](#configuring-provider-specific-guards)
   - [Creating Custom Controllers](#creating-custom-controllers)
   - [Error Handling](#error-handling)
3. [Reference](#reference)
4. [Explanation](#explanation)
   - [Overview of the Guard Router](#overview-of-the-guard-router)
   - [Provider-Based Routing](#provider-based-routing)
   - [Error Handling System](#error-handling-system)

## Tutorials

### Introduction

The `@concepta/nestjs-oauth` module provides a guard router that delegates OAuth
authentication to provider-specific guards based on the `provider` query
parameter. This allows you to support multiple OAuth providers (Google,
Facebook, GitHub, etc.) through a single unified interface.

**Important:** This module is a guard router only. It does not provide OAuth
strategies or authentication logic itself. You need to implement or use
provider-specific guards (like `@concepta/nestjs-auth-google`) that handle the
actual OAuth authentication.

### Getting Started with OAuth Guard Router

#### Step 1: Install the Package

To get started, install the `@concepta/nestjs-oauth` package:

```bash
yarn add @concepta/nestjs-oauth
```

#### Step 2: Configure Multiple OAuth Guards

Configure the OAuth module with your provider-specific guards. You need to
import the actual OAuth provider modules that provide the guards:

```ts
import { Module } from '@nestjs/common';
import { OAuthModule } from '@concepta/nestjs-oauth';
import { AuthGoogleModule, AuthGoogleGuard } from '@concepta/nestjs-auth-google';
import { AuthFacebookModule, AuthFacebookGuard } from '@concepta/nestjs-auth-facebook';
import { AuthGitHubModule, AuthGitHubGuard } from '@concepta/nestjs-auth-github';

@Module({
  imports: [
    // Import the actual OAuth provider modules
    AuthGoogleModule.forRoot({
      // Google-specific configuration
    }),
    AuthFacebookModule.forRoot({
      // Facebook-specific configuration
    }),
    AuthGitHubModule.forRoot({
      // GitHub-specific configuration
    }),
    // Configure the OAuth router with the guards from those modules
    OAuthModule.forRoot({
      oAuthGuards: [
        { name: 'google', guard: AuthGoogleGuard },
        { name: 'facebook', guard: AuthFacebookGuard },
        { name: 'github', guard: AuthGitHubGuard },
      ],
    }),
  ],
})
export class AppModule {}
```

#### Step 3: Use the OAuth Guard

Use the `OAuthGuard` in your controllers:

```ts
import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { OAuthGuard } from '@concepta/nestjs-oauth';

@Controller('auth')
@UseGuards(OAuthGuard)
export class AuthController {
  @Get('login')
  login(@Query('provider') provider: string): void {
    // The OAuthGuard will route to the appropriate provider guard
    // based on the provider query parameter
    return;
  }

  @Get('callback')
  callback(): string {
    // Handle the OAuth callback
    return 'Authentication successful';
  }
}
```

## How-To Guides

### Configuring Provider-Specific Guards

You typically use existing OAuth provider modules rather than creating guards
from scratch. For example, use `@concepta/nestjs-auth-google` for Google OAuth:

```ts
import { Module } from '@nestjs/common';
import { OAuthModule } from '@concepta/nestjs-oauth';
import { AuthGoogleModule, AuthGoogleGuard } from '@concepta/nestjs-auth-google';

@Module({
  imports: [
    // Import the Google OAuth module with its configuration
    AuthGoogleModule.forRoot({
      // Google OAuth configuration (client ID, secret, etc.)
    }),
    // Configure the OAuth router to use the Google guard
    OAuthModule.forRoot({
      oAuthGuards: [
        { name: 'google', guard: AuthGoogleGuard },
      ],
    }),
  ],
})
export class AppModule {}
```

If you need to create a custom OAuth guard, it must implement the `CanActivate`
interface:

```ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class CustomOAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    // Implement your OAuth authentication logic here
    return true;
  }
}
```

Then register it in the module:

```ts
OAuthModule.forRoot({
  oAuthGuards: [
    { name: 'custom', guard: CustomOAuthGuard },
  ],
})
```

### Creating Custom Controllers

You can create custom controllers that use the OAuth guard:

```ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { OAuthGuard } from '@concepta/nestjs-oauth';

@Controller('oauth')
@UseGuards(OAuthGuard)
export class OAuthController {
  @Get('login')
  login(): void {
    // Guard handles routing based on ?provider= query parameter
    return;
  }

  @Get('callback')
  callback(): { message: string } {
    return { message: 'OAuth callback handled' };
  }
}
```

### Error Handling

The OAuth guard provides specific exceptions for different error scenarios:

```ts
import {
  OAuthProviderMissingException,
  OAuthProviderNotSupportedException,
  OAuthConfigNotAvailableException,
  OAuthGuardInvalidException,
  OAuthAuthenticationFailedException,
} from '@concepta/nestjs-oauth';

// These exceptions are thrown automatically by the guard:
// - OAuthProviderMissingException: No provider query parameter
// - OAuthProviderNotSupportedException: Provider not configured
// - OAuthConfigNotAvailableException: Guards not properly configured
// - OAuthGuardInvalidException: Guard instance is invalid
// - OAuthAuthenticationFailedException: Authentication failed
```

## Reference

### Exported Types and Classes

- **`OAuthModule`**: Main module class with `forRoot()` and `forRootAsync()`
  methods
- **`OAuthGuard`**: Main guard that routes requests to provider-specific
  guards
- **`OAuthGuardsRecord`**: Type for mapping provider names to guard instances
- **`OAuthException`**: Base exception class for OAuth-related errors

### Configuration Options

```ts
interface OAuthOptions {
  oAuthGuards: OAuthGuardConfigInterface[];
  settings?: OAuthSettingsInterface;
}

interface OAuthGuardConfigInterface {
  name: string;           // Provider name (e.g., 'google', 'facebook')
  guard: Type<AuthGuardInterface>; // Guard class that implements AuthGuardInterface
}

interface OAuthOptionsExtrasInterface {
  global?: boolean;       // Whether the module should be global
}
```

### Usage Patterns

**URL Patterns:**

- `/auth/login?provider=google` → Routes to Google guard
- `/auth/login?provider=facebook` → Routes to Facebook guard
- `/auth/login?provider=github` → Routes to GitHub guard

## Explanation

### Overview of the Guard Router

The OAuth module provides a routing mechanism for OAuth authentication rather
than implementing OAuth strategies directly. It acts as a dispatcher that:

1. Extracts the `provider` query parameter from incoming requests
2. Validates the provider and configuration
3. Routes the request to the appropriate provider-specific guard
4. Handles the response from the provider guard

### Provider-Based Routing

The routing system works as follows:

1. **Request Processing**: When a request hits an endpoint protected by
   `OAuthGuard`, the guard extracts the `provider` query parameter.

2. **Provider Validation**: The guard validates that:
   - The provider parameter is present and not empty
   - The provider is configured in the `oAuthGuards` array
   - The corresponding guard instance is valid

3. **Guard Delegation**: The request is forwarded to the provider-specific
   guard's `canActivate` method.

4. **Response Handling**: The guard handles different return types:
   - `boolean`: Direct return
   - `Promise<boolean>`: Awaited
   - `Observable<boolean>`: Converted to Promise and awaited

### Error Handling System

The module includes comprehensive error handling:

- **`OAuthProviderMissingException`**: Thrown when no `provider` query
  parameter is provided
- **`OAuthProviderNotSupportedException`**: Thrown when the provider is not
  configured
- **`OAuthConfigNotAvailableException`**: Thrown when the guards
  configuration is invalid
- **`OAuthGuardInvalidException`**: Thrown when a guard instance doesn't
  implement `canActivate`
- **`OAuthAuthenticationFailedException`**: Thrown when the provider guard
  throws an unexpected error

This approach ensures that authentication errors are properly categorized and
can be handled appropriately by your application's error handling middleware.
