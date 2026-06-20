/** Centralised BullMQ queue + job names. */
export const QUEUES = {
  CSV_IMPORT: "csv-import",
  FOLLOWUP_REMINDER: "followup-reminder",
} as const;

export const JOBS = {
  IMPORT_CUSTOMERS: "import-customers",
  SEND_FOLLOWUP_REMINDER: "send-followup-reminder",
} as const;

export interface CsvImportJobData {
  organizationId: string;
  userId: string;
  /** Raw CSV content (small files) — large uploads switch to object storage later. */
  csv: string;
}

export interface FollowupReminderJobData {
  organizationId: string;
  followupId: string;
  userId: string;
}
