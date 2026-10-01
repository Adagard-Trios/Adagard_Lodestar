import { bootstrapService } from '@lodestar/platform';
import { AppModule } from './app.module';

bootstrapService(AppModule, 'Fleet', 3004);
