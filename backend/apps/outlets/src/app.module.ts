import { Module } from '@nestjs/common';
import { PrismaModule } from '@lodestar/prisma';
import { OutletsController } from './outlets.controller';
import { OutletsService } from './outlets.service';

@Module({ imports: [PrismaModule], controllers: [OutletsController], providers: [OutletsService] })
export class AppModule {}
