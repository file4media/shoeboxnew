CREATE TABLE `scheduled_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`editionId` int NOT NULL,
	`scheduledFor` timestamp NOT NULL,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`attempts` int NOT NULL DEFAULT 0,
	`lastAttemptAt` timestamp,
	`completedAt` timestamp,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scheduled_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `newsletter_editions` ADD `templateStyle` enum('morning-brew','minimalist','bold','magazine') DEFAULT 'morning-brew' NOT NULL;--> statement-breakpoint
ALTER TABLE `newsletters` ADD `welcomeEmailSubject` varchar(255);--> statement-breakpoint
ALTER TABLE `newsletters` ADD `welcomeEmailContent` text;--> statement-breakpoint
ALTER TABLE `newsletters` ADD `sendWelcomeEmail` boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE INDEX `editionId_idx` ON `scheduled_jobs` (`editionId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `scheduled_jobs` (`status`);--> statement-breakpoint
CREATE INDEX `scheduledFor_idx` ON `scheduled_jobs` (`scheduledFor`);