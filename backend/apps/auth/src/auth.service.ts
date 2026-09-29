import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@lodestar/prisma';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    const { passwordHash, refreshToken, ...safe } = user;
    return safe;
  }

  async login(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role, depot: user.depot };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: await bcrypt.hash(refreshToken, 10) },
    });
    return { accessToken, refreshToken, user };
  }

  async refresh(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.refreshToken) throw new UnauthorizedException();
    const match = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!match) throw new UnauthorizedException();
    const { passwordHash, refreshToken: _rt, ...safe } = user;
    return this.login(safe);
  }

  async logout(userId: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { refreshToken: null } });
    return { message: 'Logged out' };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { outlet: true },
    });
    if (!user) throw new UnauthorizedException();
    const { passwordHash, refreshToken, ...safe } = user;
    return safe;
  }

  async getUsers(depot?: string, role?: Role) {
    return this.prisma.user.findMany({
      where: {
        ...(depot ? { depot: depot as any } : {}),
        ...(role  ? { role } : {}),
        isActive: true,
      },
      select: { id: true, email: true, name: true, role: true, depot: true, outletId: true, phone: true },
      orderBy: { name: 'asc' },
    });
  }
}
