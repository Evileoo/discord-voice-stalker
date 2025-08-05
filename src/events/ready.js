import { Events } from 'discord.js';
import { db } from '../connections/database.js';

// Executed when bot is ready
export const event = {
    name: Events.ClientReady,
    once: true,
    async execute(client){
        // Bot is ready message
        console.log(`Ready! Logged in as ${client.user.tag}`);

        client.user.setActivity("Compte le temps passé mute de Toto");
        client.user.setStatus("online");

        // Le bot a été relancé, on ferme tous les events
        await db.query(`
            UPDATE user_voice_event 
            SET event_end_tms = ?
            WHERE event_end_tms IS NULL
        `, [
            new Date()
        ]);
    }
}