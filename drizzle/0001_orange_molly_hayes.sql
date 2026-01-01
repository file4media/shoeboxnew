CREATE TABLE `email_tracking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`editionId` int NOT NULL,
	`subscriberId` int NOT NULL,
	`openedAt` timestamp,
	`openCount` int NOT NULL DEFAULT 0,
	`lastOpenedAt` timestamp,
	`ipAddress` varchar(45),
	`userAgent` text,
	`trackingToken` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_tracking_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_tracking_trackingToken_unique` UNIQUE(`trackingToken`)
);
--> statement-breakpoint
CREATE TABLE `newsletter_editions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`newsletterId` int NOT NULL,
	`subject` varchar(500) NOT NULL,
	`previewText` varchar(500),
	`contentMarkdown` text,
	`contentHtml` text,
	`status` enum('draft','scheduled','sending','sent','failed') NOT NULL DEFAULT 'draft',
	`scheduledAt` timestamp,
	`sentAt` timestamp,
	`totalRecipients` int NOT NULL DEFAULT 0,
	`totalOpens` int NOT NULL DEFAULT 0,
	`uniqueOpens` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `newsletter_editions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `newsletter_subscribers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`newsletterId` int NOT NULL,
	`subscriberId` int NOT NULL,
	`status` enum('subscribed','unsubscribed') NOT NULL DEFAULT 'subscribed',
	`subscribedAt` timestamp NOT NULL DEFAULT (now()),
	`unsubscribedAt` timestamp,
	CONSTRAINT `newsletter_subscribers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `newsletters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`fromName` varchar(255) NOT NULL,
	`fromEmail` varchar(320) NOT NULL,
	`replyToEmail` varchar(320),
	`logoUrl` text,
	`primaryColor` varchar(7) DEFAULT '#3b82f6',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `newsletters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscribers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(255),
	`status` enum('active','unsubscribed','bounced') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscribers_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscribers_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE INDEX `editionId_idx` ON `email_tracking` (`editionId`);--> statement-breakpoint
CREATE INDEX `subscriberId_idx` ON `email_tracking` (`subscriberId`);--> statement-breakpoint
CREATE INDEX `trackingToken_idx` ON `email_tracking` (`trackingToken`);--> statement-breakpoint
CREATE INDEX `newsletterId_idx` ON `newsletter_editions` (`newsletterId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `newsletter_editions` (`status`);--> statement-breakpoint
CREATE INDEX `newsletterId_idx` ON `newsletter_subscribers` (`newsletterId`);--> statement-breakpoint
CREATE INDEX `subscriberId_idx` ON `newsletter_subscribers` (`subscriberId`);--> statement-breakpoint
CREATE INDEX `unique_subscription_idx` ON `newsletter_subscribers` (`newsletterId`,`subscriberId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `newsletters` (`userId`);--> statement-breakpoint
CREATE INDEX `email_idx` ON `subscribers` (`email`);