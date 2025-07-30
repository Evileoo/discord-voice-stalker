import { Events } from 'discord.js';
import { db } from '../connections/database.js';

// Executed when bot is ready
export const event = {
    name: Events.VoiceStateUpdate,
    once: false,
    async execute(oldVoiceState, newVoiceState){

        //console.log(oldVoiceState, newVoiceState);

        // Préparation des variables d'insertion
        const userId = newVoiceState.id;
        const username = newVoiceState.guild.members.cache.get(newVoiceState.id).user.username;
        const channelId = (newVoiceState.channelId != null) ? newVoiceState.channelId : oldVoiceState.channelId;
        const channelName = (newVoiceState.channelId != null) ? newVoiceState.guild.channels.cache.get(newVoiceState.channelId).name : oldVoiceState.guild.channels.cache.get(oldVoiceState.channelId).name;
        const joinedTms = (newVoiceState.channelId != null && newVoiceState.channelId != oldVoiceState.channelId);
        const leftTms = (newVoiceState.channelId == null);
        const selfMuted = (newVoiceState.selfMute == true && newVoiceState.selfMute != oldVoiceState.selfMute);
        const serverMuted = (newVoiceState.serverMute == true && newVoiceState.serverMute != oldVoiceState.serverMute);
        const selfUnmuted = (newVoiceState.selfMute == false && newVoiceState.selfMute != oldVoiceState.selfMute);
        const serverUnmuted = (newVoiceState.serverMute == false && newVoiceState.serverMute != oldVoiceState.serverMute);
        const selfDeafen = (newVoiceState.selfDeaf == true && newVoiceState.selfDeaf != oldVoiceState.selfDeaf);
        const serverDeafen = (newVoiceState.serverDeaf == true && newVoiceState.serverDeaf != oldVoiceState.serverDeaf);
        const selfUndeafen = (newVoiceState.selfDeaf == false && newVoiceState.selfDeaf != oldVoiceState.selfDeaf);
        const serverUndeafen = (newVoiceState.serverDeaf == false && newVoiceState.serverDeaf != oldVoiceState.serverDeaf);
        const streamStarted = (newVoiceState.streaming == true && newVoiceState.streaming != oldVoiceState.streaming);
        const streamEnded = (newVoiceState.streaming == false && newVoiceState.streaming != oldVoiceState.streaming);
        const camStarted = (newVoiceState.selfVideo == true && newVoiceState.selfVideo != oldVoiceState.selfVideo);
        const camEnded = (newVoiceState.selfVideo == false && newVoiceState.selfVideo != oldVoiceState.selfVideo);

        // Insertion de l'event dans la base de données
        const insertId = await db.insert(`
            INSERT INTO user_voice_event (
                user_id,
                user_name,
                channel_id,
                channel_name,
                joined_tms,
                left_tms,
                self_muted_tms,
                self_unmuted_tms,
                server_muted_tms,
                server_unmuted_tms,
                self_deafen_tms,
                self_undeafen_tms,
                server_deafen_tms,
                server_undeafen_tms,
                stream_start_tms,
                stream_end_tms,
                cam_start_tms,
                cam_end_tms
            ) VALUES (
                ?,
                ?,
                ?,
                ?,
                IF(? = true, CURRENT_TIMESTAMP(), null),
                IF(? = true, CURRENT_TIMESTAMP(), null),
                IF(? = true, CURRENT_TIMESTAMP(), null),
                IF(? = true, CURRENT_TIMESTAMP(), null),
                IF(? = true, CURRENT_TIMESTAMP(), null),
                IF(? = true, CURRENT_TIMESTAMP(), null),
                IF(? = true, CURRENT_TIMESTAMP(), null),
                IF(? = true, CURRENT_TIMESTAMP(), null),
                IF(? = true, CURRENT_TIMESTAMP(), null),
                IF(? = true, CURRENT_TIMESTAMP(), null),
                IF(? = true, CURRENT_TIMESTAMP(), null),
                IF(? = true, CURRENT_TIMESTAMP(), null),
                IF(? = true, CURRENT_TIMESTAMP(), null),
                IF(? = true, CURRENT_TIMESTAMP(), null)
            );
        `, [
            userId,
            username,
            channelId,
            channelName,
            joinedTms,
            leftTms,
            selfMuted,
            selfUnmuted,
            serverMuted,
            serverUnmuted,
            selfDeafen,
            selfUndeafen,
            serverDeafen,
            serverUndeafen,
            streamStarted,
            streamEnded,
            camStarted,
            camEnded,
        ]);


        /*
            Data utile:
            serverDeaf
            serverMute
            selfDeaf
            selfMute
            selfVideo
            streaming
            channelId
            afkChannelId
        */
    }
}