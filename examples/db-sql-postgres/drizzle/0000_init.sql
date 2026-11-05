CREATE TABLE "example_users" (
	"id" bigint PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"nickname" text,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "example_users_email_unique" UNIQUE("email")
);
