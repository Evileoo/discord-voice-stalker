import { EmbedBuilder, MessageFlags } from 'discord.js';
import { globals } from '../globals.js';
import { stats } from '../functions/stats.js';

export const selectMenu = {
    async execute(interaction, selectMenuData){
        // Get the user input
        //console.log(interaction.values);
        //console.log(interaction.message.embeds[0]);

        const command = {
            memberId: null,
            memberCompareId: null,
            channelId: null,
            periodeStart: null,
            periodeEnd: null,
            eventTypeId: interaction.values[0],
            afkChannelId: interaction.guild.afkChannelId
        }

        const tab = interaction.message.embeds[0].data.description.split(">");

        tab.forEach(element => {
            const id = element.split("<");
            if(id.length > 1) {
                const type = id[1].charAt(0);

                switch(type) {
                    case "#":
                        if(id[1].substring(1) != command.afkChannelId) command.channelId = id[1].substring(1);
                    break;
                    case "@":
                        if(!command.memberId) {
                            command.memberId = id[1].substring(1);
                        } else {
                            command.memberCompareId = id[1].substring(1);
                        }
                    break;
                    case "t":
                        const date = new Date(parseInt(id[1].slice(2, -2)) * 1000);
                        const dateDDMMYYYY = ((date.getDate() > 9) ? date.getDate() : ('0' + date.getDate())) + '/' + ((date.getMonth() > 8) ? (date.getMonth() + 1) : ('0' + (date.getMonth() + 1))) + "/" + date.getFullYear();
                        if(id[0].slice(-3, -1) == "du") {
                            command.periodeStart = dateDDMMYYYY;
                        } else {
                            command.periodeEnd = dateDDMMYYYY;
                        }
                    break;
                }
            }
        });

        // Exécution de la requête
        const rawData = await stats.query(command);

        // Traitement des données
        const data = await stats.dataTreatment(command, rawData);

        // Récupération de l'embed de réponse
        const reply = await stats.replyGeneration(command, data);

        // Réponse
        const interactionChannel = interaction.guild.channels.cache.get(interaction.message.channelId);
        const interactionMessage = await interactionChannel.messages.fetch(interaction.message.id);

        await interactionMessage.edit(reply);
        await interaction.deferUpdate();
    }
}