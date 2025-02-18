import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verify } from 'jsonwebtoken';

@Injectable()
export class TokenService {
    constructor(private configService: ConfigService) {}

    extractToken(connectionParams: any): string | undefined {
        return connectionParams?.token || undefined;
    }

    validateToken(token: string): any {
        const refreshSecretToken = this.configService.get<string>('REFRESH_SECRET_TOKEN');
        if (!refreshSecretToken) {
            throw new UnauthorizedException('REFRESH_SECRET_TOKEN is not defined');
        }
        try {
            return verify(token, refreshSecretToken);
        } catch (error) {
            return null;
        }
    }
}
