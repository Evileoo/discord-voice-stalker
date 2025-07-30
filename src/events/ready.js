import { Events } from 'discord.js';
import { db } from '../connections/database.js';

// Executed when bot is ready
export const event = {
    name: Events.ClientReady,
    once: true,
    async execute(client){
        // Bot is ready message
        console.log(`Ready! Logged in as ${client.user.tag}`);

        client.user.setActivity("QUOI? FEUR");
        client.user.setStatus("online");
    }
}