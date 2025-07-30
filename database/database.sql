-- Drop Tables
DROP TABLE IF EXISTS user_voice_event;


-- Create user_voice_event
CREATE TABLE IF NOT EXISTS user_voice_event (
    event_id         INT         NOT NULL AUTO_INCREMENT COMMENT "identifiant de l'event",
    channel_id       VARCHAR(50) NOT NULL                COMMENT "Identifiant du channel discord dans lequel l'event s'est déclenché" 
    channel_name     VARCHAR(50)     NULL                COMMENT "Nom du channel (au cas où il est supprimé)",
    joined_tms       TIMESTAMP       NULL                COMMENT "",
    left_tms         TIMESTAMP       NULL                COMMENT "",
    muted_tms        TIMESTAMP       NULL                COMMENT "",
    unmuted_tms      TIMESTAMP       NULL                COMMENT "",
    deafen_tms       TIMESTAMP       NULL                COMMENT "",
    undeafen_tms     TIMESTAMP       NULL                COMMENT "",
    PRIMARY KEY (event_id)
) ENGINE=INNODB COMMENT="evènements gérés";