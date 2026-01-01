CREATE TABLE `articles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`editionId` int NOT NULL,
	`category` varchar(100),
	`title` varchar(500) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`excerpt` text,
	`imageUrl` text,
	`imageCaption` varchar(255),
	`displayOrder` int NOT NULL DEFAULT 0,
	`isPublished` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `articles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `newsletter_editions` ADD `introText` text;--> statement-breakpoint
ALTER TABLE `newsletter_editions` ADD `scheduledFor` timestamp;--> statement-breakpoint
CREATE INDEX `editionId_idx` ON `articles` (`editionId`);--> statement-breakpoint
CREATE INDEX `slug_idx` ON `articles` (`slug`);--> statement-breakpoint
CREATE INDEX `edition_slug_idx` ON `articles` (`editionId`,`slug`);--> statement-breakpoint
CREATE INDEX `scheduledFor_idx` ON `newsletter_editions` (`scheduledFor`);--> statement-breakpoint
ALTER TABLE `newsletter_editions` DROP COLUMN `scheduledAt`;