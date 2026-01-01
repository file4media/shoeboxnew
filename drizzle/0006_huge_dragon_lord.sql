CREATE TABLE `newsletter_sections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`editionId` int NOT NULL,
	`sectionType` enum('header','text','article','quote','image','cta','divider','list','code','video') NOT NULL,
	`title` varchar(500),
	`subtitle` text,
	`content` text,
	`imageUrl` text,
	`imageCaption` varchar(255),
	`buttonText` varchar(100),
	`buttonUrl` text,
	`aiGenerated` boolean NOT NULL DEFAULT false,
	`aiPrompt` text,
	`displayOrder` int NOT NULL DEFAULT 0,
	`isVisible` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `newsletter_sections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `editionId_idx` ON `newsletter_sections` (`editionId`);--> statement-breakpoint
CREATE INDEX `displayOrder_idx` ON `newsletter_sections` (`editionId`,`displayOrder`);