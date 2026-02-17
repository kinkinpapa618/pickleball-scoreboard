CREATE TABLE "courts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text,
	"status" text DEFAULT 'free' NOT NULL,
	"current_match_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "tournament_matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"tournament_id" integer NOT NULL,
	"match_id" integer,
	"team1_player1" text NOT NULL,
	"team1_player2" text NOT NULL,
	"team2_player1" text NOT NULL,
	"team2_player2" text NOT NULL,
	"group_name" text,
	"round" integer,
	"match_order" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"referee_id" integer,
	"court_id" integer,
	"scheduled_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tournament_players" (
	"id" serial PRIMARY KEY NOT NULL,
	"tournament_id" integer NOT NULL,
	"name" text NOT NULL,
	"group_name" text,
	"seed" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tournaments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"teams_per_group" integer DEFAULT 4,
	"winning_score" integer DEFAULT 11,
	"status" text DEFAULT 'draft' NOT NULL,
	"level" text,
	"content" jsonb,
	"date" date,
	"time" time,
	"location" text,
	"court" text,
	"creator_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "timeline" text;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "timeouts" text;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "stacking" text;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "penalties" text;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "start_time" timestamp;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "end_time" timestamp;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "is_first_serve_of_match" boolean;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "court_id" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "manager_id" integer;--> statement-breakpoint
ALTER TABLE "courts" ADD CONSTRAINT "courts_current_match_id_matches_id_fk" FOREIGN KEY ("current_match_id") REFERENCES "public"."matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_referee_id_users_id_fk" FOREIGN KEY ("referee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_court_id_courts_id_fk" FOREIGN KEY ("court_id") REFERENCES "public"."courts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_players" ADD CONSTRAINT "tournament_players_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_court_id_courts_id_fk" FOREIGN KEY ("court_id") REFERENCES "public"."courts"("id") ON DELETE no action ON UPDATE no action;