-- Drop Tables
DROP TABLE IF EXISTS user_voice_event;


-- Create user_voice_event
CREATE TABLE IF NOT EXISTS user_voice_event (
    event_id         INT         NOT NULL AUTO_INCREMENT COMMENT "Identifiant de l'event",
    user_id          VARCHAR(50) NOT NULL                COMMENT "Identifiant de l'utilisateur",
    user_name        VARCHAR(50) NOT NULL                COMMENT "Nom de l'utilisateur (au cas où il quitte)"
    channel_id       VARCHAR(50) NOT NULL                COMMENT "Identifiant du channel discord dans lequel l'event s'est déclenché" 
    channel_name     VARCHAR(50)     NULL                COMMENT "Nom du channel (au cas où il est supprimé)",
    joined_tms       TIMESTAMP       NULL                COMMENT "Timestamp auquel l'user a rejoint le channel",
    left_tms         TIMESTAMP       NULL                COMMENT "Timestamp auquel l'user a quitté le channel",
    muted_tms        TIMESTAMP       NULL                COMMENT "Timestamp auquel l'user s'est/a été mute",
    unmuted_tms      TIMESTAMP       NULL                COMMENT "Timestamp auquel l'user s'est/a été demute",
    deafen_tms       TIMESTAMP       NULL                COMMENT "Timestamp auquel l'user s'est/a été deafen",
    undeafen_tms     TIMESTAMP       NULL                COMMENT "Timestamp auquel l'user s'est/a été undeafen",
    PRIMARY KEY (event_id)
) ENGINE=INNODB COMMENT="Évènements gérés";