import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { QUEUES } from "../../queue/queue.constants";
import { CsvImportProcessor } from "./csv-import.processor";
import { CustomersController } from "./customers.controller";
import { CustomersRepository } from "./customers.repository";
import { CustomersService } from "./customers.service";

@Module({
  imports: [BullModule.registerQueue({ name: QUEUES.CSV_IMPORT })],
  controllers: [CustomersController],
  providers: [CustomersService, CustomersRepository, CsvImportProcessor],
  exports: [CustomersService],
})
export class CustomersModule {}
