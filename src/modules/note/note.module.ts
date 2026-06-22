import { Module } from '@nestjs/common';
import { NoteController } from './note.controller';
import { NoteRepository } from './note.repository';
import { NoteService } from './note.service';

@Module({
  controllers: [NoteController],
  providers: [NoteService, NoteRepository],
  exports: [NoteService, NoteRepository],
})
export class NoteModule {}
