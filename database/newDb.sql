-- Drop db
DROP DATABASE IF EXISTS stalker_bot;

-- Create db
CREATE DATABASE stalker_bot;
USE stalker_bot;

-- Drop tables
DROP TABLE IF EXISTS user_voice_event;
DROP TABLE IF EXISTS event_type;

-- Create event_type
CREATE TABLE IF NOT EXISTS event_type (
    event_type_id       CHAR(3)     NOT NULL   COMMENT "Type d'évènement",
    event_type_lib      VARCHAR(50)     NULL   COMMENT "Libellé du type d'évènement",
    PRIMARY KEY (event_type_id)
) ENGINE=INNODB COMMENT="Types d'évènements gérés";

-- Create user_voice_event
CREATE TABLE IF NOT EXISTS user_voice_event (
    event_id            INT         NOT NULL AUTO_INCREMENT COMMENT "Identifiant de l'event",
    user_id             VARCHAR(50) NOT NULL                COMMENT "Identifiant de l'utilisateur",
    user_name           VARCHAR(50) NOT NULL                COMMENT "Nom de l'utilisateur (au cas où il quitte)",
    channel_id          VARCHAR(50) NOT NULL                COMMENT "Identifiant du channel discord dans lequel l'event s'est déclenché",
    channel_name        VARCHAR(50) NOT NULL                COMMENT "Nom du channel (au cas où il est supprimé)",
    event_type_id       CHAR(3)     NOT NULL                COMMENT "Type d'évènement",
    event_start_dt      DATETIME    NOT NULL                COMMENT "Timestamp du début de l'évènement",
    event_end_dt        DATETIME        NULL                COMMENT "Timestamp de la fin de l'évènement",
    PRIMARY KEY (event_id),
    FOREIGN KEY (event_type_id) REFERENCES event_type(event_type_id)
) ENGINE=INNODB COMMENT="Évènements gérés";

CREATE INDEX idx_user_id
ON user_voice_event (user_id);

CREATE INDEX idx_channel_id
ON user_voice_event (channel_id);

-- Insertion des types d'évènements
INSERT INTO event_type (event_type_id, event_type_lib) VALUES 
('SRD', 'Sourdine au niveau serveur'),
('SFD', 'Sourdine au niveau utilisateur'),
('SRM', 'Muet au niveau serveur'),
('SFM', 'Muet au niveau Utilisateur'),
('VCL', 'Temps en vocal'),
('STR', 'Partage d''écran'),
('CAM', 'Caméra allumée');
