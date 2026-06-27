CREATE TYPE "public"."notification_type" AS ENUM('chat', 'match', 'tournament', 'schedule', 'system');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin', 'manager', 'referee');--> statement-breakpoint
CREATE TABLE "badminton_matches" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "badminton_matches_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"team1_player1" text NOT NULL,
	"team1_player2" text DEFAULT '' NOT NULL,
	"team2_player1" text NOT NULL,
	"team2_player2" text DEFAULT '' NOT NULL,
	"type" text DEFAULT 'doubles' NOT NULL,
	"best_of" integer DEFAULT 3 NOT NULL,
	"winning_points" integer DEFAULT 21 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"current_game" integer DEFAULT 1 NOT NULL,
	"games_won_team1" integer DEFAULT 0 NOT NULL,
	"games_won_team2" integer DEFAULT 0 NOT NULL,
	"winner_team" integer,
	"game_scores" json DEFAULT '[]'::json NOT NULL,
	"current_score_team1" integer DEFAULT 0 NOT NULL,
	"current_score_team2" integer DEFAULT 0 NOT NULL,
	"serving_team" integer DEFAULT 1 NOT NULL,
	"serving_player" integer DEFAULT 1 NOT NULL,
	"team1_swapped" boolean DEFAULT false NOT NULL,
	"team2_swapped" boolean DEFAULT false NOT NULL,
	"team1_side" text DEFAULT 'left' NOT NULL,
	"ends_changed" boolean DEFAULT false NOT NULL,
	"state_history" json DEFAULT '[]'::json NOT NULL,
	"timeline" json DEFAULT '[]'::json NOT NULL,
	"referee_id" integer,
	"creator_id" integer,
	"start_time" timestamp DEFAULT now(),
	"end_time" timestamp,
	"date" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chats" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "chats_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"group_id" integer,
	"sender_id" integer NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "group_members" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "group_members_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"group_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"joined_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "groups_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"description" text,
	"manager_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "matches_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"team1_player1" text NOT NULL,
	"team1_player2" text NOT NULL,
	"team2_player1" text NOT NULL,
	"team2_player2" text NOT NULL,
	"score_team1" integer DEFAULT 0 NOT NULL,
	"score_team2" integer DEFAULT 0 NOT NULL,
	"is_server1" boolean DEFAULT false NOT NULL,
	"is_server2" boolean DEFAULT false NOT NULL,
	"server_number" integer DEFAULT 1 NOT NULL,
	"type" text DEFAULT 'doubles' NOT NULL,
	"status" text DEFAULT 'live' NOT NULL,
	"winning_score" integer DEFAULT 11 NOT NULL,
	"winner_team" integer,
	"timeline" json,
	"timeouts" json,
	"stacking" json,
	"penalties" json,
	"start_time" timestamp DEFAULT now(),
	"end_time" timestamp,
	"is_first_serve_of_match" boolean,
	"referee_id" integer,
	"creator_id" integer,
	"date" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "notifications_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"link" text,
	"data" json,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "players_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"total_matches" integer DEFAULT 0,
	"wins" integer DEFAULT 0,
	CONSTRAINT "players_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sid" text PRIMARY KEY NOT NULL,
	"sess" json NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "settings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"key" text NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "tournament_matches" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tournament_matches_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
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
	"referee_token" text,
	"scheduled_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tournament_players" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tournament_players_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tournament_id" integer NOT NULL,
	"name" text NOT NULL,
	"group_name" text,
	"seed" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tournaments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tournaments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"description" text,
	"teams_per_group" integer DEFAULT 4,
	"winning_score" integer DEFAULT 11,
	"status" text DEFAULT 'draft' NOT NULL,
	"level" text,
	"content" json,
	"date" date,
	"time" time,
	"location" text,
	"backdrop" text,
	"creator_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"username" text NOT NULL,
	"password" text NOT NULL,
	"role" "role" DEFAULT 'referee' NOT NULL,
	"full_name" text,
	"phone" text NOT NULL,
	"id_card" text NOT NULL,
	"manager_id" integer,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "work_schedules" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "work_schedules_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
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
ALTER TABLE "badminton_matches" ADD CONSTRAINT "badminton_matches_referee_id_users_id_fk" FOREIGN KEY ("referee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "badminton_matches" ADD CONSTRAINT "badminton_matches_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_referee_id_users_id_fk" FOREIGN KEY ("referee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_referee_id_users_id_fk" FOREIGN KEY ("referee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_players" ADD CONSTRAINT "tournament_players_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_schedules" ADD CONSTRAINT "work_schedules_referee_id_users_id_fk" FOREIGN KEY ("referee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_schedules" ADD CONSTRAINT "work_schedules_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE no action ON UPDATE no action;