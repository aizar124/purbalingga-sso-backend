import { Module, Global } from '@nestjs/common';
import { SessionsService } from './sessions.service';

@Global() // Global agar bisa dipakai semua module tanpa import ulang
@Module({
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
