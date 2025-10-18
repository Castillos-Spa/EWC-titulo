import { Module } from '@nestjs/common';
import { QaService } from './qa.service';
import { QaController } from './qa.controller';

@Module({
  imports: [],
  controllers: [QaController],
  providers: [
    QaService,
    // Export a provider under the token 'IQaService' so modules that inject by token can resolve it
    {
      provide: 'IQaService',
      useExisting: QaService,
    },
  ],
  exports: [QaService, 'IQaService'],
})
export class QaModule {}
