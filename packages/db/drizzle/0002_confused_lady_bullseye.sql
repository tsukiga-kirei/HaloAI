CREATE TYPE "public"."project_role" AS ENUM('lead', 'contributor', 'reviewer', 'observer');--> statement-breakpoint
ALTER TABLE "project_memberships" ADD COLUMN "role" "project_role" DEFAULT 'contributor' NOT NULL;--> statement-breakpoint
UPDATE "project_memberships" AS membership
SET "role" = 'lead'
FROM "projects" AS project
WHERE membership."workspace_id" = project."workspace_id"
  AND membership."project_id" = project."id"
  AND membership."actor_id" = project."created_by_actor_id";
