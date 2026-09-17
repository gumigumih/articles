ALTER TABLE `articles` ADD `platform` text DEFAULT 'note' NOT NULL;--> statement-breakpoint
ALTER TABLE `articles` ADD `source_path` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `articles` ADD `source_kind` text DEFAULT 'article' NOT NULL;--> statement-breakpoint
ALTER TABLE `articles` ADD `source_evidence` text DEFAULT '' NOT NULL;