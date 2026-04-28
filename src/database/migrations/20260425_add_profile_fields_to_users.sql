ALTER TABLE `users`
  MODIFY `avatarUrl` LONGTEXT NULL;

SET @birth_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'birthDate'
);
SET @sql := IF(
  @birth_exists = 0,
  'ALTER TABLE `users` ADD COLUMN `birthDate` DATE NULL AFTER `avatarUrl`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @phone_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'phone'
);
SET @sql := IF(
  @phone_exists = 0,
  'ALTER TABLE `users` ADD COLUMN `phone` VARCHAR(30) NULL AFTER `birthDate`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @city_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'city'
);
SET @sql := IF(
  @city_exists = 0,
  'ALTER TABLE `users` ADD COLUMN `city` VARCHAR(120) NULL AFTER `phone`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @bio_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'bio'
);
SET @sql := IF(
  @bio_exists = 0,
  'ALTER TABLE `users` ADD COLUMN `bio` TEXT NULL AFTER `city`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @gender_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'gender'
);
SET @sql := IF(
  @gender_exists = 0,
  'ALTER TABLE `users` ADD COLUMN `gender` ENUM(\'male\', \'female\', \'other\') NULL AFTER `bio`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
