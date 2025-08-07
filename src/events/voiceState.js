import { Events } from 'discord.js';
import { db } from '../connections/database.js';

// Executed when bot is ready
export const event = {
    name: Events.VoiceStateUpdate,
    once: false,
    async execute(oldVoiceState, newVoiceState){

        const date = new Date();

        ///////////////////////////////
        // traitement des évènements //
        ///////////////////////////////

        if(newVoiceState.channelId == null) {
            // Cas où on quitte tout vocal
            // On met fin à tous les events de l'utilisateur en cours
            await dbDeleteAll();

        } else if(oldVoiceState.channelId == null) {
            // Dans le cas où on rejoint un channel sans venir d'un autre
            // Ajout de l'event "Rejoint un salon vocal" dans la bdd
            await dbInsert("VCL");

            // Traitement de toutes les autres données possibles de l'évènement
            if(newVoiceState.selfMute == true) await dbInsert("SFM");
            if(newVoiceState.selfDeaf == true) await dbInsert("SFD");
            if(newVoiceState.serverMute == true) await dbInsert("SRM");
            if(newVoiceState.serverDeaf == true) await dbInsert("SRD");
            if(newVoiceState.streaming == true) await dbInsert("STR");
            if(newVoiceState.selfVideo == true) await dbInsert("CAM");

        } else if(newVoiceState.channelId != oldVoiceState.channelId) {
            // On coupe tous les events puisqu'on change de channel...
            await dbDeleteAll();

            // ...et on les recrée
            await dbInsert("VCL");
            if(newVoiceState.selfMute == true) await dbInsert("SFM");
            if(newVoiceState.selfDeaf == true) await dbInsert("SFD");
            if(newVoiceState.serverMute == true) await dbInsert("SRM");
            if(newVoiceState.serverDeaf == true) await dbInsert("SRD");
            if(newVoiceState.streaming == true) await dbInsert("STR");
            if(newVoiceState.selfVideo == true) await dbInsert("CAM");

        } else {
            // Changement statut self mute
            if(newVoiceState.selfMute == true && oldVoiceState.selfMute == false && !await checkActiveEvent("SFM")) await dbInsert("SFM");
            else if(newVoiceState.selfMute == false && oldVoiceState.selfMute == true) await dbDelete("SFM");
            // Changement statut self deafen
            if(newVoiceState.selfDeaf == true && oldVoiceState.selfDeaf == false && !await checkActiveEvent("SFD")) await dbInsert("SFD");
            else if(newVoiceState.selfDeaf == false && oldVoiceState.selfDeaf == true) await dbDelete("SFD");
            // Changement statut server mute
            if(newVoiceState.serverMute == true && oldVoiceState.serverMute == false && !await checkActiveEvent("SRM")) await dbInsert("SRM");
            else if(newVoiceState.serverMute == false && oldVoiceState.serverMute == true) await dbDelete("SRM");
            // Changement statut server deafen
            if(newVoiceState.serverDeaf == true && oldVoiceState.serverDeaf == false && !await checkActiveEvent("SRD")) await dbInsert("SRD");
            else if(newVoiceState.serverDeaf == false && oldVoiceState.serverDeaf == true) await dbDelete("SRD");
            // changement statut streaming
            if(newVoiceState.streaming == true && oldVoiceState.streaming == false && !await checkActiveEvent("STR")) await dbInsert("STR");
            else if(newVoiceState.streaming == false && oldVoiceState.streaming == true) await dbDelete("STR");
            // Changement statut caméra
            if(newVoiceState.selfVideo == true && oldVoiceState.selfVideo == false && !await checkActiveEvent("CAM")) await dbInsert("CAM");
            else if(newVoiceState.selfVideo == false && oldVoiceState.selfVideo == true) await dbDelete("CAM");
        }

        ///////////////
        // Fonctions //
        ///////////////

        async function dbInsert(eventType) {
            await db.query(`
                INSERT INTO user_voice_event (user_id, user_name, channel_id, channel_name, event_type_id, event_start_tms)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [
                newVoiceState.id,
                newVoiceState.guild.members.cache.get(newVoiceState.id).user.username,
                newVoiceState.channelId,
                newVoiceState.guild.channels.cache.get(newVoiceState.channelId).name,
                eventType,
                date
            ]);
        }

        async function dbDelete(eventType) {
            await db.query(`
                UPDATE user_voice_event
                SET event_end_tms = ?
                WHERE user_id = ?
                AND event_type_id = ?
                AND event_end_tms IS NULL
            `, [
                date,
                newVoiceState.id,
                eventType
            ]);
        }

        async function dbDeleteAll() {
            await db.query(`
                UPDATE user_voice_event
                SET event_end_tms = ?
                WHERE event_id IN (
                    SELECT * FROM (
                        SELECT e.event_id
                        FROM user_voice_event e
                        WHERE user_id = ?
                        AND event_end_tms IS NULL
                    ) AS X
                )
            `, [
                date,
                newVoiceState.id
            ]);
        }

        async function checkActiveEvent(eventType) {
            const isActive = await db.getval(`
                SELECT 1
                FROM user_voice_event
                WHERE event_type_id = ?
                AND user_id = ?
                and event_end_tms IS NULL
            `, [
                eventType,
                newVoiceState.id
            ]);

            return (isActive) ? true : false;
        }

    }
}