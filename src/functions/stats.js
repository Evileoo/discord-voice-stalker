import { db } from "../connections/database.js";
import { EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } from "discord.js";
import { manageDates } from "./manageDates.js";

export const stats = {
    async query(params) {

        // Cas qui permet de gérer le temps passé dans le channel AFK
        if(params.eventTypeId == "AFK") {
            params.channelId = params.afkChannelId
            params.eventTypeId = "VCL";
        }


        let query = `
            SELECT user_id
            , user_name
            , channel_id
            , channel_name
            , event_type_id
            , DATE_FORMAT(event_start_tms, '%d/%m/%Y %H:%i:%s') AS "event_start_tms"
            , COALESCE(DATE_FORMAT(event_end_tms, '%d/%m/%Y %H:%i:%s'), DATE_FORMAT(CURRENT_TIMESTAMP(), '%d/%m/%Y %H:%i:%s')) AS "event_end_tms" 
            FROM user_voice_event 
            WHERE 1=1 
        `;

        // Ajout des paramètres optionnels à la requête
        if(params.memberId && params.memberCompareId) query += `AND user_id IN ('${params.memberId}', '${params.memberCompareId}') `;
        else if(params.memberId) query += `AND user_id='${params.memberId}' `;
        if(params.channelId) query += `AND channel_id='${params.channelId}' `;
        if(params.periodeStart) query += `AND event_start_tms >= STR_TO_DATE('${params.periodeStart}', '%d/%m/%Y') `;
        if(params.periodeEnd) query += `AND event_end_tms <= STR_TO_DATE('${params.periodeEnd}', '%d/%m/%Y') `;
    
        return await db.query(query);
    
    },
    async dataTreatment(params, data) {

        if(params.memberCompareId) {

        } else if(params.memberId) {
            
        } else {
            const userTab = [];

            // On parcours les données de la base pour grouper tout le temps de vocal par utilisateur
            data.forEach(element => {
                if(element.event_type_id == params.eventTypeId){
                    let found = false;
                    for(let i = 0; i < userTab.length; i++) {
                        if(userTab[i].userId == element.user_id) {
                            found = true;
                            userTab[i].totalTime += manageDates.calculPeriode(element.event_start_tms, element.event_end_tms);
                            break;
                        }
                    }
                    if(!found) {
                        userTab.push({userId: `${element.user_id}`, totalTime: manageDates.calculPeriode(element.event_start_tms, element.event_end_tms)});
                    }
                }
            });

            // On trie par ordre décroissant afin d'avoir en premier ceux qui ont le plus de temps
            userTab.sort((a,b) => b.totalTime - a.totalTime);

            return userTab;
        }

    },
    async replyGeneration(params, data) {

        // Construction des éléments de réponse
        const embed = new EmbedBuilder();
        const eventList = new StringSelectMenuBuilder();
        const row = new ActionRowBuilder();

        // Préparation de la description de l'embed
        let embedDescription = ``;

        if(params.memberCompareId) {
            embed.setTitle(`Comparaison des statistiques`);
            embedDescription += `Intéressés: <@${params.memberId}> et <@${params.memberCompareId}>`;
        } else if(params.memberId) {
            embed.setTitle(`Statistiques`);
            embedDescription += `de <@${params.memberId}>`;
        } else {
            embed.setTitle(`TOP 10`);

            switch(params.eventTypeId) {
                case "CAM":
                    embedDescription += "du temps passé en vocal avec la caméra allumée";
                break;
                case "SFD":
                    embedDescription += "du temps passé en vocal en étant en sourdine";
                break;
                case "SFM":
                    embedDescription += "du temps passé en vocal en étant mute";
                break;
                case "SRD":
                    embedDescription += "du temps passé en vocal en ayant été mis en sourdine";
                break;
                case "SRM":
                    embedDescription += "du temps passé en vocal en ayant été mute";
                break;
                case "STR":
                    embedDescription += "du temps passé à stream en vocal";
                break;
                case "VCL":
                    embedDescription += "du temps passé en vocal";
                break;
                case "AFK":
                    embedDescription += "du temps passé dans le channel AFK";
                break;
            }

            // Préparation du contenu de l'embed
            let rank = 1;
            let rankSentance = ``;
            let userSentance = ``;
            let timeSentance = ``;

            data.forEach(element => {
                // Conversion du temps en millisecondes en jour heure minute seconde
                const time = manageDates.dhms(element.totalTime);

                rankSentance += `${rank}.\n`;
                userSentance += `<@${element.userId}>\n`;
                timeSentance += `${time.days}j ${time.hours}h${time.minutes}m${time.seconds}s\n`;

                rank++;
            });

            // Ajout du contenu dans l'embed
            embed.addFields(
                { name: `Rang`, value: `${rankSentance}`, inline: true },
                { name: `Membre`, value: `${userSentance}`, inline: true },
                { name: `Temps`, value: `${timeSentance}`, inline: true },
            );

            // Ajout des données dans le select menu
            eventList.setCustomId(`eventTypes`)
            .setPlaceholder(`Choisir un tri`);

            const eventTypes = await db.query(`SELECT * FROM event_type`);

            eventTypes.forEach(element => {
                eventList.addOptions(
                    new StringSelectMenuOptionBuilder()
                    .setLabel(`${element.event_type_lib}`)
                    .setValue(`${element.event_type_id}`)
                );
            });

            // Ajout du temps passé AFK
            eventList.addOptions(
                new StringSelectMenuOptionBuilder()
                .setLabel(`Temps passé dans le salon afk`)
                .setValue(`AFK`)
            );

            row.addComponents(eventList);
        }

        switch(true) {
            case params.periodeStart != null && params.periodeEnd != null:
                embedDescription += `\nPériode du <t:${manageDates.conversionDatetoJSDate(params.periodeStart).getTime() / 1000}:D> au <t:${manageDates.conversionDatetoJSDate(params.periodeEnd).getTime() / 1000}:D>`;
            break;
            case params.periodeStart != null:
                embedDescription += `\nPériode du <t:${manageDates.conversionDatetoJSDate(params.periodeStart).getTime() / 1000}:D> à aujourd'hui`;
            break;
            case params.periodeEnd != null:
                embedDescription += `\nPériode du début des temps au <t:${manageDates.conversionDatetoJSDate(params.periodeEnd).getTime() / 1000}:D>`;
            break;
        }

        if(params.channelId != null) {
            embedDescription += `\nDans le channel <#${params.channelId}>`;
        }

        // Ajout de la description à l'embed
        embed.setDescription(embedDescription);

        // envoi du message à générer
        if(params.memberCompareId) {
            
        } else if(params.memberId) {
            
        } else {
            return {
                embeds: [embed],
                components: [row]
            }
        }
    }
}