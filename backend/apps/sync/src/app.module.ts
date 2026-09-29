import { Module } from '@nestjs/common';
import { PrismaModule } from '@lodestar/prisma';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';

@Module({ imports: [PrismaModule], controllers: [SyncController], providers: [SyncService] })
export class AppModule {}
