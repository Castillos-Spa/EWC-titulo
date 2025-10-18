// src/app/shared/shared.module.ts

import { Module } from '@nestjs/common';

// En un futuro, aquí podrías declarar y exportar Pipes, Guards, etc.
// Por ahora, como solo tenemos un DTO, el módulo puede estar vacío.
// Su existencia nos sirve para organizar la estructura.
@Module({
  providers: [],
  exports: [],
})
export class SharedModule {}
