ALTER TABLE `users`
  MODIFY `avatarUrl` LONGTEXT NULL,
  ADD COLUMN `birthDate` DATE NULL AFTER `avatarUrl`,
  ADD COLUMN `phone` VARCHAR(30) NULL AFTER `birthDate`,
  ADD COLUMN `city` VARCHAR(120) NULL AFTER `phone`,
  ADD COLUMN `bio` TEXT NULL AFTER `city`,
  ADD COLUMN `gender` ENUM('male', 'female', 'other') NULL AFTER `bio`;
