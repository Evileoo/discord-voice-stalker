-- Drop db
DROP DATABASE IF EXISTS stalker_bot;

-- Create db
CREATE DATABASE stalker_bot;
USE stalker_bot;

-- Drop tables
DROP TABLE IF EXISTS user_voice_event;

-- Create user_voice_event
CREATE TABLE IF NOT EXISTS user_voice_event (
    event_id            INT         NOT NULL AUTO_INCREMENT COMMENT "Identifiant de l'event",
    user_id             VARCHAR(50) NOT NULL                COMMENT "Identifiant de l'utilisateur",
    user_name           VARCHAR(50) NOT NULL                COMMENT "Nom de l'utilisateur (au cas où il quitte)",
    channel_id          VARCHAR(50) NOT NULL                COMMENT "Identifiant du channel discord dans lequel l'event s'est déclenché",
    channel_name        VARCHAR(50)     NULL                COMMENT "Nom du channel (au cas où il est supprimé)",
    joined_tms          TIMESTAMP       NULL                COMMENT "Timestamp auquel l'user a rejoint le channel",
    left_tms            TIMESTAMP       NULL                COMMENT "Timestamp auquel l'user a quitté le channel",
    self_muted_tms      TIMESTAMP       NULL                COMMENT "Timestamp auquel l'user s'est mute",
    self_unmuted_tms    TIMESTAMP       NULL                COMMENT "Timestamp auquel l'user s'est demute",
    server_muted_tms    TIMESTAMP       NULL                COMMENT "Timestamp auquel l'user a été mute",
    server_unmuted_tms  TIMESTAMP       NULL                COMMENT "Timestamp auquel l'user a été demute",
    self_deafen_tms     TIMESTAMP       NULL                COMMENT "Timestamp auquel l'user s'est deafen",
    self_undeafen_tms   TIMESTAMP       NULL                COMMENT "Timestamp auquel l'user s'est undeafen",
    server_deafen_tms   TIMESTAMP       NULL                COMMENT "Timestamp auquel l'user a été deafen",
    server_undeafen_tms TIMESTAMP       NULL                COMMENT "Timestamp auquel l'user a été undeafen",
    stream_start_tms    TIMESTAMP       NULL                COMMENT "Timestamp auquel l'user a commencé à stream",
    stream_end_tms      TIMESTAMP       NULL                COMMENT "Timestamp auquel l'user a coupé son stream",
    cam_start_tms       TIMESTAMP       NULL                COMMENT "Timestamp auquel l'user a allumé sa caméra",
    cam_end_tms         TIMESTAMP       NULL                COMMENT "Timestamp auquel l'user a coupé sa cam",
    PRIMARY KEY (event_id)
) ENGINE=INNODB COMMENT="Évènements gérés";

CREATE INDEX idx_user_id
ON user_voice_event (user_id);

CREATE INDEX idx_channel_id
ON user_voice_event (channel_id);