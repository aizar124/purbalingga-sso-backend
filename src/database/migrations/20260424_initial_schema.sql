CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) NOT NULL,
  email VARCHAR(255) NOT NULL,
  username VARCHAR(255) NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NULL,
  avatarUrl LONGTEXT NULL,
  birthDate DATE NULL,
  phone VARCHAR(30) NULL,
  city VARCHAR(120) NULL,
  bio TEXT NULL,
  gender ENUM('male', 'female', 'other') NULL,
  role ENUM('user', 'admin', 'superadmin') NOT NULL DEFAULT 'user',
  isVerified TINYINT(1) NOT NULL DEFAULT 0,
  verifyToken VARCHAR(255) NULL,
  verifyTokenExpiry DATETIME NULL,
  mfaSecret VARCHAR(255) NULL,
  mfaEnabled TINYINT(1) NOT NULL DEFAULT 0,
  resetToken VARCHAR(255) NULL,
  resetTokenExpiry DATETIME NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_verify_token (verifyToken),
  UNIQUE KEY uq_users_reset_token (resetToken)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS oauth_clients (
  id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  clientId VARCHAR(255) NOT NULL,
  clientSecret VARCHAR(255) NOT NULL,
  redirectUris JSON NOT NULL,
  allowedScopes JSON NOT NULL,
  logoUrl VARCHAR(255) NULL,
  description TEXT NULL,
  isActive TINYINT(1) NOT NULL DEFAULT 1,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_oauth_clients_client_id (clientId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS authorization_codes (
  code VARCHAR(255) NOT NULL,
  userId VARCHAR(36) NOT NULL,
  clientId VARCHAR(255) NOT NULL,
  redirectUri VARCHAR(2048) NOT NULL,
  scopes JSON NOT NULL,
  codeChallenge VARCHAR(255) NULL,
  codeChallengeMethod VARCHAR(32) NULL,
  nonce VARCHAR(255) NULL,
  expiresAt DATETIME NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (code),
  KEY idx_auth_codes_user_id (userId),
  KEY idx_auth_codes_client_id (clientId),
  KEY idx_auth_codes_expires_at (expiresAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS consents (
  id VARCHAR(36) NOT NULL,
  userId VARCHAR(36) NOT NULL,
  clientId VARCHAR(255) NOT NULL,
  scopes JSON NOT NULL,
  grantedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_consents_user_client (userId, clientId),
  KEY idx_consents_user_id (userId),
  KEY idx_consents_client_id (clientId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS monitoring_events (
  id VARCHAR(36) NOT NULL,
  eventType ENUM(
    'register_success',
    'login_success',
    'login_failed',
    'token_validate',
    'activity',
    'last_active',
    'users_list',
    'user_detail',
    'active_users_list',
    'active_users_detail'
  ) NOT NULL,
  actorUserId VARCHAR(36) NULL,
  subjectUserId VARCHAR(36) NULL,
  clientId VARCHAR(255) NULL,
  route VARCHAR(120) NULL,
  method VARCHAR(16) NULL,
  success TINYINT(1) NOT NULL DEFAULT 1,
  statusCode INT NULL,
  ip VARCHAR(255) NULL,
  userAgent VARCHAR(255) NULL,
  metadata JSON NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_monitoring_event_type (eventType),
  KEY idx_monitoring_actor_user_id (actorUserId),
  KEY idx_monitoring_subject_user_id (subjectUserId),
  KEY idx_monitoring_client_id (clientId),
  KEY idx_monitoring_created_at (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
