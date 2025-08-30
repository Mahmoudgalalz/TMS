ALTER TYPE "ticket_severity" ADD VALUE 'VERY_HIGH';--> statement-breakpoint
ALTER TYPE "ticket_severity" ADD VALUE 'HIGH';--> statement-breakpoint
ALTER TYPE "ticket_severity" ADD VALUE 'MEDIUM';--> statement-breakpoint
ALTER TYPE "ticket_severity" ADD VALUE 'LOW';--> statement-breakpoint
ALTER TYPE "ticket_severity" ADD VALUE 'EASY';--> statement-breakpoint
ALTER TYPE "ticket_status" ADD VALUE 'OPEN';--> statement-breakpoint
ALTER TYPE "ticket_status" ADD VALUE 'IN_PROGRESS';--> statement-breakpoint
ALTER TYPE "ticket_status" ADD VALUE 'RESOLVED';--> statement-breakpoint
ALTER TYPE "ticket_status" ADD VALUE 'CLOSED';--> statement-breakpoint
ALTER TYPE "ticket_status" ADD VALUE 'DRAFT';--> statement-breakpoint
ALTER TYPE "ticket_status" ADD VALUE 'REOPENED';--> statement-breakpoint
ALTER TABLE "tickets" ALTER COLUMN "severity" SET DEFAULT 'MEDIUM';--> statement-breakpoint
ALTER TABLE "tickets" ALTER COLUMN "status" SET DEFAULT 'OPEN';