CREATE TABLE `edition_articles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`editionId` int NOT NULL,
	`articleId` int NOT NULL,
	`displayOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `edition_articles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
DROP INDEX `editionId_idx` ON `articles`;--> statement-breakpoint
DROP INDEX `edition_slug_idx` ON `articles`;--> statement-breakpoint
ALTER TABLE `articles` ADD `newsletterId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `articles` ADD `status` enum('draft','published','archived') DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE `articles` ADD `publishedAt` timestamp;--> statement-breakpoint
CREATE INDEX `editionId_idx` ON `edition_articles` (`editionId`);--> statement-breakpoint
CREATE INDEX `articleId_idx` ON `edition_articles` (`articleId`);--> statement-breakpoint
CREATE INDEX `unique_edition_article_idx` ON `edition_articles` (`editionId`,`articleId`);--> statement-breakpoint
CREATE INDEX `newsletterId_idx` ON `articles` (`newsletterId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `articles` (`status`);--> statement-breakpoint
ALTER TABLE `articles` DROP COLUMN `editionId`;--> statement-breakpoint
ALTER TABLE `articles` DROP COLUMN `displayOrder`;--> statement-breakpoint
ALTER TABLE `articles` DROP COLUMN `isPublished`;