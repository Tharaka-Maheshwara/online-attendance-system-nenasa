import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import JwksRsa from 'jwks-rsa';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const client = JwksRsa({
      jwksUri:
        'https://login.microsoftonline.com/a7a43c95-55b0-4d14-98c5-a7478dfb87d3/discovery/v2.0/keys',
      requestHeaders: {},
      timeout: 30000,
    });

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      audience: '9a2a5624-5ed7-4449-b2b0-e1862e68fdcc', // Your Azure AD app client ID
      issuer:
        'https://login.microsoftonline.com/a7a43c95-55b0-4d14-98c5-a7478dfb87d3/v2.0',
      algorithms: ['RS256'],
      secretOrKeyProvider: (request, rawJwtToken, done) => {
        const decoded = JSON.parse(
          Buffer.from(rawJwtToken.split('.')[0], 'base64').toString(),
        );
        client.getSigningKey(decoded.kid, (err, key) => {
          if (err) {
            return done(err, null);
          }
          if (!key) {
            return done(new Error('No key found'), null);
          }
          const signingKey = key.getPublicKey();
          done(null, signingKey);
        });
      },
    });
  }

  async validate(payload: any) {
    // Azure AD token validation
    console.log('JWT Payload:', payload);
    return {
      userId: payload.sub || payload.oid,
      username: payload.preferred_username || payload.upn || payload.email,
      email: payload.preferred_username || payload.upn || payload.email,
      name: payload.name,
      roles: payload.roles || [],
    };
  }
}
