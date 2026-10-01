import { bootstrapService } from '@lodestar/platform';
import { AppModule } from './app.module';

bootstrapService(AppModule, 'Trips', 3006);
