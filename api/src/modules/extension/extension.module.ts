import { Module } from '@nestjs/common';
import { CustomerModule } from '../customer/customer.module';
import { NoteModule } from '../note/note.module';
import { OrderModule } from '../order/order.module';
import { ExtensionController } from './extension.controller';
import { ExtensionService } from './extension.service';

@Module({
  imports: [CustomerModule, NoteModule, OrderModule],
  controllers: [ExtensionController],
  providers: [ExtensionService],
})
export class ExtensionModule {}
