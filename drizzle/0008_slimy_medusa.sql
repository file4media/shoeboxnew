CREATE TABLE `authors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`newsletterId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`bio` text,
	`writingStyle` varchar(100) NOT NULL,
	`tone` varchar(100) NOT NULL,
	`personality` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `authors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `articles` ADD `authorId` int;--> statement-breakpoint
CREATE INDEX `newsletterId_idx` ON `authors` (`newsletterId`);