ALTER TABLE `articles` ADD `slug` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `articles` ADD `note_id` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `articles` ADD `publication_status` text DEFAULT '要確認' NOT NULL;--> statement-breakpoint
ALTER TABLE `articles` ADD `magazine` text DEFAULT '未分類' NOT NULL;--> statement-breakpoint
ALTER TABLE `articles` ADD `price` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `articles` ADD `published_at` text;--> statement-breakpoint
ALTER TABLE `articles` ADD `last_checked_at` text;--> statement-breakpoint
ALTER TABLE `articles` ADD `git_status` text DEFAULT 'clean' NOT NULL;--> statement-breakpoint
ALTER TABLE `articles` ADD `cover_status` text DEFAULT 'missing' NOT NULL;--> statement-breakpoint
ALTER TABLE `articles` ADD `pv` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `articles` ADD `likes` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `articles` ADD `metrics_fetched_at` text;--> statement-breakpoint
ALTER TABLE `articles` ADD `x_posted` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `articles` ADD `update_candidate` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `articles` ADD `body_preview` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `articles` ADD `markdown_state` text DEFAULT 'missing' NOT NULL;--> statement-breakpoint
ALTER TABLE `articles` ADD `x_copy_state` text DEFAULT 'missing' NOT NULL;--> statement-breakpoint
ALTER TABLE `articles` ADD `cover_prompt_state` text DEFAULT 'missing' NOT NULL;--> statement-breakpoint
ALTER TABLE `articles` ADD `cover_file_state` text DEFAULT 'missing' NOT NULL;--> statement-breakpoint
ALTER TABLE `articles` ADD `synced_at` text;--> statement-breakpoint
ALTER TABLE `articles` ADD `sync_status` text DEFAULT 'stale' NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_articles_publication_status` ON `articles` (`publication_status`);--> statement-breakpoint
CREATE INDEX `idx_articles_magazine` ON `articles` (`magazine`);--> statement-breakpoint
CREATE INDEX `idx_articles_git_status` ON `articles` (`git_status`);