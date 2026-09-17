DROP INDEX `articles_url_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `articles_url_unique` ON `articles` (`url`) WHERE "articles"."url" <> '';