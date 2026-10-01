import { bootstrapService } from '@lodestar/platform';
import { AppModule } from './app.module';

bootstrapService(AppModule, 'Audit', 3009);
