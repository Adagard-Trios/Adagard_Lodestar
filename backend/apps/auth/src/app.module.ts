import { Module } from '@nestjs/common';
import { LODESTAR_SERVICE_DOCUMENT, ODataModule } from '@lodestar/odata';
import { PlatformModule } from '@lodestar/platform';
import { AuthService } from './auth.service';
import { DevicesSet, UsersSet } from './auth.sets';
import { KeycloakAdminClient } from './keycloak-admin.client';

@Module({
  imports: [
    PlatformModule.forService('auth'),
    ODataModule.forRoot({
      service: 'auth',
      entitySets: [UsersSet, DevicesSet],
      providers: [AuthService, KeycloakAdminClient],
      // No NGINX on AKS: auth answers GET /odata/v4/ with every set of the platform.
      serviceDocument: LODESTAR_SERVICE_DOCUMENT,
    }),
  ],
})
export class AppModule {}
