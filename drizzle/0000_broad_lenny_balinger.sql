CREATE TABLE "matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"team1_player1" text NOT NULL,
	"team1_player2" text NOT NULL,
	"team2_player1" text NOT NULL,
	"team2_player2" text NOT NULL,
	"score_team1" integer DEFAULT 0 NOT NULL,
	"score_team2" integer DEFAULT 0 NOT NULL,
	"is_server1" boolean DEFAULT false NOT NULL,
	"is_server2" boolean DEFAULT false NOT NULL,
	"server_number" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'live' NOT NULL,
	"winning_score" integer DEFAULT 11 NOT NULL,
	"winner_team" integer,
	"referee_id" integer,
	"date" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"total_matches" integer DEFAULT 0,
	"wins" integer DEFAULT 0,
	CONSTRAINT "players_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'referee' NOT NULL,
	"full_name" text,
	"phone" text NOT NULL,
	"id_card" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "work_schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"referee_id" integer,
	"title" text NOT NULL,
	"description" text,
	"match_id" integer,
	"date" timestamp NOT NULL,
	"location" text,
	"status" text DEFAULT 'assigned' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_referee_id_users_id_fk" FOREIGN KEY ("referee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_schedules" ADD CONSTRAINT "work_schedules_referee_id_users_id_fk" FOREIGN KEY ("referee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_schedules" ADD CONSTRAINT "work_schedules_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE no action ON UPDATE no action;