// src/manifest/manifest.module.ts
import { Module } from '@nestjs/common';
import { ManifestService } from './manifest.service';

@Module({
  providers: [ManifestService],
  exports: [ManifestService], // Make the service available for other modules to inject
})
export class ManifestModule {}
