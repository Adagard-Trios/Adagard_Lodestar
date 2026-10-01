import { bootstrapService } from '@lodestar/platform';
import { AppModule } from './app.module';

bootstrapService(AppModule, 'Planning', 3003);
