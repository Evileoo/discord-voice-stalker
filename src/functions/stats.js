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

        if(params.memberId) {

            const statsTab = [];

            data.forEach(element => {
                // Si l'utilisateur est dans le salon AFK, on change le type d'évènement
                if(element.channel_id == params.afkChannelId) element.event_type_id = "AFK";

                let found = false;
                for(let i = 0; i < statsTab.length; i++) {
                    if(statsTab[i].userId == element.user_id) {
                        found = true;
                        switch(element.event_type_id) {
                            case "CAM":
                                statsTab[i].data.cam += manageDates.calculPeriode(element.event_start_tms, element.event_end_tms);
                            break;
                            case "SFD":
                                statsTab[i].data.sfd += manageDates.calculPeriode(element.event_start_tms, element.event_end_tms);
                            break;
                            case "SFM":
                                statsTab[i].data.sfm += manageDates.calculPeriode(element.event_start_tms, element.event_end_tms);
                            break;
                            case "SRD":
                                statsTab[i].data.srd += manageDates.calculPeriode(element.event_start_tms, element.event_end_tms);
                            break;
                            case "SRM":
                                statsTab[i].data.srm += manageDates.calculPeriode(element.event_start_tms, element.event_end_tms);
                            break;
                            case "STR":
                                statsTab[i].data.str += manageDates.calculPeriode(element.event_start_tms, element.event_end_tms);
                            break;
                            case "VCL":
                                statsTab[i].data.vcl += manageDates.calculPeriode(element.event_start_tms, element.event_end_tms);
                            break;
                            case "AFK":
                                statsTab[i].data.afk += manageDates.calculPeriode(element.event_start_tms, element.event_end_tms);
                            break;
                        }

                        break;
                    }
                }

                if(!found) {
                    statsTab.push({
                        userId: element.user_id,
                        member: element.user_id == params.memberId,
                        data: {
                            cam: (element.event_type_id == "CAM") ? manageDates.calculPeriode(element.event_start_tms, element.event_end_tms) : 0,
                            sfd: (element.event_type_id == "SFD") ? manageDates.calculPeriode(element.event_start_tms, element.event_end_tms) : 0,
                            sfm: (element.event_type_id == "SFM") ? manageDates.calculPeriode(element.event_start_tms, element.event_end_tms) : 0,
                            srd: (element.event_type_id == "SRD") ? manageDates.calculPeriode(element.event_start_tms, element.event_end_tms) : 0,
                            srm: (element.event_type_id == "SRM") ? manageDates.calculPeriode(element.event_start_tms, element.event_end_tms) : 0,
                            str: (element.event_type_id == "STR") ? manageDates.calculPeriode(element.event_start_tms, element.event_end_tms) : 0,
                            vcl: (element.event_type_id == "VCL") ? manageDates.calculPeriode(element.event_start_tms, element.event_end_tms) : 0,
                            afk: (element.event_type_id == "AFK") ? manageDates.calculPeriode(element.event_start_tms, element.event_end_tms) : 0
                        }
                    })
                }
            });

            return statsTab;
            
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
        let memberI = 0;
        let compareI = 1;

        if(params.memberId) {
            if(params.memberCompareId) {
                embed.setTitle(`Comparaison des statistiques`);
                embedDescription += `Intéressés: <@${params.memberId}> et <@${params.memberCompareId}>`;
                if(data[1].member) {
                    memberI = 1;
                    compareI = 0;
                }
            } else {
                embed.setTitle(`Statistiques`);
                embedDescription += `de <@${params.memberId}>`;
            }

            let statsSentance = `Présence en vocal\nMute\nSourdine\nStream\nAFK\nCaméra allumée`;
            let memberSentance = ``;
            let memberCompareSentance = ``;
            let time;

            if(params.memberCompareId) {
                time = manageDates.dhms(data[memberI].data.vcl);
                if(data[memberI].data.vcl > data[compareI].data.vcl) memberSentance += `**${time.days}j ${time.hours}h${time.minutes}m${time.seconds}s**\n`;
                else memberSentance += `${time.days}j ${time.hours}h${time.minutes}m${time.seconds}s\n`;
                time = manageDates.dhms(data[memberI].data.srm + data[memberI].data.sfm);
                if((data[memberI].data.srm + data[memberI].data.sfm) > (data[compareI].data.srm + data[compareI].data.sfm)) memberSentance += `**${time.days}j ${time.hours}h${time.minutes}m${time.seconds}s**\n`;
                else memberSentance += `${time.days}j ${time.hours}h${time.minutes}m${time.seconds}s\n`;
                time = manageDates.dhms(data[memberI].data.srd + data[memberI].data.sfd);
                if((data[memberI].data.srd + data[memberI].data.sfd) > (data[compareI].data.srd + data[compareI].data.sfd)) memberSentance += `**${time.days}j ${time.hours}h${time.minutes}m${time.seconds}s**\n`;
                else memberSentance += `${time.days}j ${time.hours}h${time.minutes}m${time.seconds}s\n`;
                time = manageDates.dhms(data[memberI].data.str);
                if(data[memberI].data.str > data[compareI].data.str) memberSentance += `**${time.days}j ${time.hours}h${time.minutes}m${time.seconds}s**\n`;
                else memberSentance += `${time.days}j ${time.hours}h${time.minutes}m${time.seconds}s\n`;
                time = manageDates.dhms(data[memberI].data.afk);
                if(data[memberI].data.afk > data[compareI].data.afk) memberSentance += `**${time.days}j ${time.hours}h${time.minutes}m${time.seconds}s**\n`;
                else memberSentance += `${time.days}j ${time.hours}h${time.minutes}m${time.seconds}s\n`;
                time = manageDates.dhms(data[memberI].data.cam);
                if(data[memberI].data.cam > data[compareI].data.cam) memberSentance += `**${time.days}j ${time.hours}h${time.minutes}m${time.seconds}s**\n`;
                else memberSentance += `${time.days}j ${time.hours}h${time.minutes}m${time.seconds}s\n`;

                time = manageDates.dhms(data[compareI].data.vcl);
                if(data[compareI].data.vcl > data[memberI].data.vcl) memberCompareSentance += `**${time.days}j ${time.hours}h${time.minutes}m${time.seconds}s**\n`;
                else memberCompareSentance += `${time.days}j ${time.hours}h${time.minutes}m${time.seconds}s\n`;
                time = manageDates.dhms(data[compareI].data.srm + data[compareI].data.sfm);
                if((data[memberI].data.srm + data[memberI].data.sfm) < (data[compareI].data.srm + data[compareI].data.sfm)) memberCompareSentance += `**${time.days}j ${time.hours}h${time.minutes}m${time.seconds}s**\n`;
                else memberCompareSentance += `${time.days}j ${time.hours}h${time.minutes}m${time.seconds}s\n`;
                time = manageDates.dhms(data[compareI].data.srd + data[compareI].data.sfd);
                if((data[memberI].data.srd + data[memberI].data.sfd) < (data[compareI].data.srd + data[compareI].data.sfd)) memberCompareSentance += `**${time.days}j ${time.hours}h${time.minutes}m${time.seconds}s**\n`;
                else memberCompareSentance += `${time.days}j ${time.hours}h${time.minutes}m${time.seconds}s\n`;
                time = manageDates.dhms(data[compareI].data.str);
                if(data[compareI].data.str > data[memberI].data.str) memberCompareSentance += `**${time.days}j ${time.hours}h${time.minutes}m${time.seconds}s**\n`;
                else memberCompareSentance += `${time.days}j ${time.hours}h${time.minutes}m${time.seconds}s\n`;
                time = manageDates.dhms(data[compareI].data.afk);
                if(data[compareI].data.afk > data[memberI].data.afk) memberCompareSentance += `**${time.days}j ${time.hours}h${time.minutes}m${time.seconds}s**\n`;
                else memberCompareSentance += `${time.days}j ${time.hours}h${time.minutes}m${time.seconds}s\n`;
                time = manageDates.dhms(data[compareI].data.cam);
                if(data[compareI].data.cam > data[memberI].data.cam) memberCompareSentance += `**${time.days}j ${time.hours}h${time.minutes}m${time.seconds}s**\n`;
                else memberCompareSentance += `${time.days}j ${time.hours}h${time.minutes}m${time.seconds}s\n`;
            } else {
                time = manageDates.dhms(data[memberI].data.vcl);
                memberSentance += `${time.days}j ${time.hours}h${time.minutes}m${time.seconds}s\n`;
                time = manageDates.dhms(data[memberI].data.srm + data[memberI].data.sfm);
                memberSentance += `${time.days}j ${time.hours}h${time.minutes}m${time.seconds}s\n`;
                time = manageDates.dhms(data[memberI].data.srd + data[memberI].data.sfd);
                memberSentance += `${time.days}j ${time.hours}h${time.minutes}m${time.seconds}s\n`;
                time = manageDates.dhms(data[memberI].data.str);
                memberSentance += `${time.days}j ${time.hours}h${time.minutes}m${time.seconds}s\n`;
                time = manageDates.dhms(data[memberI].data.afk);
                memberSentance += `${time.days}j ${time.hours}h${time.minutes}m${time.seconds}s\n`;
                time = manageDates.dhms(data[memberI].data.cam);
                memberSentance += `${time.days}j ${time.hours}h${time.minutes}m${time.seconds}s\n`;
            }


            embed.addFields({ name: `Statistique`, value: `${statsSentance}`, inline: true },);
            if(params.memberCompareId) embed.addFields({ name: `intessé 1`, value: `${memberSentance}`, inline: true }, { name: `interessé`, value: `${memberCompareSentance}`, inline: true });
            else embed.addFields({ name: `Valeur`, value: `${memberSentance}`, inline: true });


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
        if(params.memberId) {
            return {
                embeds: [embed]
            }
        } else {
            return {
                embeds: [embed],
                components: [row]
            }
        }
    }
}