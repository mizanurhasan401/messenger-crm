import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { QUEUES } from "../../queue/queue.constants";
import { FollowupReminderProcessor } from "./followups.processor";
import { FollowupsController } from "./followups.controller";
import { FollowupsService } from "./followups.service";

@Module({
  imports: [BullModule.registerQueue({ name: QUEUES.FOLLOWUP_REMINDER })],
  controllers: [FollowupsController],
  providers: [FollowupsService, FollowupReminderProcessor],
  exports: [FollowupsService],
})
export class FollowupsModule {}
