import { bootstrapService } from '@lodestar/platform';
import { AppModule } from './app.module';

bootstrapService(AppModule, 'Notifications (HTTP + WebSocket)', 3008);
