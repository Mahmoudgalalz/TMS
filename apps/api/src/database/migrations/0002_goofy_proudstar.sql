ALTER TABLE "tickets" DROP CONSTRAINT "tickets_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "tickets" ALTER COLUMN "status" SET DEFAULT 'DRAFT';--> statement-breakpoint
ALTER TABLE "tickets" ALTER COLUMN "due_date" SET DATA TYPE varchar(30);--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "created_by_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "assigned_to_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tickets" ADD CONSTRAINT "tickets_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "tickets" DROP COLUMN IF EXISTS "created_by";