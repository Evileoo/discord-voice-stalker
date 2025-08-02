import { SlashCommandBuilder, EmbedBuilder, ChannelType, MessageFlags, underline } from 'discord.js';
import { db } from '../connections/database.js';

export const command = {
	data: new SlashCommandBuilder()
		.setName("stats")
		.setDescription("Statsiques des vocaux")
        .addUserOption( (option) =>
            option
            .setName("membre")
            .setDescription("membre duquel on souhaite les stats")
            .setRequired(false)
        )
        .addChannelOption( (option) =>
            option
            .setName("channel")
            .setDescription("channel vocal duquel on veut les stats")
            .setRequired(false)
            .addChannelTypes(ChannelType.GuildVoice)
        )
        .addUserOption( (option) =>
            option
            .setName("membre_compare")
            .setDescription("Membre auquel on compare le premier membre saisi")
            .setRequired(false)
        )
        .addStringOption( (option) =>
            option
            .setName("periode_debut")
            .setDescription("Début de la période d'analyse JJ/MM/YYYY")
            .setRequired(false)
        )
        .addStringOption( (option) =>
            option
            .setName("periode_fin")
            .setDescription("Fin de la période d'analyse JJ/MM/YYYY")
            .setRequired(false)
        )
	, async execute(interaction) {

        // Récupération des données
        let member = interaction.options.getUser("membre");
        let channel = interaction.options.getChannel("channel");
        let memberCompare = interaction.options.getUser("membre_compare");
        let periodeStart = interaction.options.getString("periode_debut");
        let periodeEnd = interaction.options.getString("periode_fin");

        // Préparation de la requête SQL
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

        // Si on veut comparer un membre avec personne, ...
        if(!member && memberCompare) {
            member = memberCompare; // ...on le met en membre duquel on veut les stats
            memberCompare = null;
        }


        // Ajout des paramètres saisis dans la commande à la requête
		if(member && memberCompare) query += `AND user_id IN ('${member.id}', '${memberCompare.id}') `;
        else if(member) query += `AND user_id='${member.id}' `;
		if(channel) query += `AND channel_id='${channel.id}' `;
        if(periodeStart) query += `AND event_start_tms >= STR_TO_DATE('${periodeStart}', '%d/%m/%Y') `;
        if(periodeEnd) query += `AND event_end_tms <= STR_TO_DATE('${periodeEnd}', '%d/%m/%Y') `;

        // Contrôle de la cohérence des données
        if( (periodeStart != null && !controleFormatDate(periodeStart)) || (periodeEnd != null && !controleFormatDate(periodeEnd))) {
            return await interaction.reply({
                content: `La date doit être au format JJ/MM/AAAA`,
                flags: MessageFlags.Ephemeral
            });
        }

        // Exécution de la requête
        const data = await db.query(query);

        // Préparation du message de réponse
        const embed = new EmbedBuilder();

        let embedDescription = ``;

        if(memberCompare) {
            embed.setTitle(`Comparaison des statistiques`);
            embedDescription += `Intéressés: <@${member.id}> et <@${memberCompare.id}>`;
        } else if(member) {
            embed.setTitle(`Statistiques`);
            embedDescription += `de <@${member.id}>`;
        } else {
            embed.setTitle(`TOP 10`);
            embedDescription += `des plus présents en vocal`;

            const userTab = [];

            // On parcours les données de la base pour grouper tout le temps de vocal par utilisateur
            data.forEach(element => {
                if(element.event_type_id == "VCL"){
                    let found = false;
                    for(let i = 0; i < userTab.length; i++) {
                        if(userTab[i].userId == element.user_id) {
                            found = true;
                            userTab[i].totalTime += calculPeriode(element.event_start_tms, element.event_end_tms);
                            break;
                        }
                    }
                    if(!found) {
                        userTab.push({userId: `${element.user_id}`, totalTime: calculPeriode(element.event_start_tms, element.event_end_tms)});
                    }
                }
            });

            // On trie par ordre décroissant afin d'avoir en premier ceux qui ont le plus de temps
            userTab.sort((a,b) => b.totalTime - a.totalTime);

            // Préparation à l'affichage des données
            let rank = 1;
            let rankSentance = ``;
            let userSentance = ``;
            let timeSentance = ``;
            userTab.forEach(element => {
                // Conversion du temps en millisecondes en jour heure minute seconde
                const time = dhms(element.totalTime);

                rankSentance += `${rank}.\n`;
                userSentance += `<@${element.userId}>\n`;
                timeSentance += `${time.days}j ${time.hours}h${time.minutes}m${time.seconds}s\n`
            });

            embed.addFields(
                { name: `Rang`, value: `${rankSentance}`, inline: true },
                { name: `Membre`, value: `${userSentance}`, inline: true },
                { name: `Temps`, value: `${timeSentance}`, inline: true },
            )


        }

        switch(true) {
            case periodeStart != null && periodeEnd != null:
                embedDescription += `\nPériode du <t:${conversionDatetoJSDate(periodeStart).getTime() / 1000}:D> au <t:${conversionDatetoJSDate(periodeEnd).getTime() / 1000}:D>`;
            break;
            case periodeStart != null:
                embedDescription += `\nPériode du <t:${conversionDatetoJSDate(periodeStart).getTime() / 1000}:D> à aujourd'hui`;
            break;
            case periodeEnd != null:
                embedDescription += `\nPériode du début des temps au <t:${conversionDatetoJSDate(periodeEnd).getTime() / 1000}:D>`;
            break;
        }

        if(channel != null) {
            embedDescription += `\nDans le channel <#${channel.id}>`;
        }

        embed.setDescription(embedDescription);

        // Réponse
        await interaction.reply({
            embeds: [embed],
        });


        function calculPeriode(start, end) {
            // Conversion du format de date SQL retourné en format JS
            const startDate = conversionDatetoJSDate(start);
            const endDate = conversionDatetoJSDate(end);

            // Retourne la différence en millisecondes
            return endDate - startDate;
        }

        function conversionDatetoJSDate(date) {
            // Conversion de la date en tableau
            const tab = date.split(/[/ :-]/);

            // Formattage de la date du format DD/MM/YYYY HH:MM:SS en format JS
            let formatted;
            if(tab[3] == undefined) {
                return new Date(Date.UTC(tab[2], tab[1]-1, tab[0]));
            } else {
                return new Date(Date.UTC(tab[2], tab[1]-1, tab[0], tab[3], tab[4], tab[5]));
            }
        }

        function controleFormatDate(date) {
            // Passage de la date en format de tableau
            const tab = date.split(/[/ :-]/);

            // Contrôle des données du tableau
            if(isNaN(tab[0]) || isNaN(tab[1]) || isNaN(tab[2]) || tab[0] < 1 || tab[0] > 31 || tab[1] < 1 || tab[1] > 12 || tab[2] < 1000 || tab[2] > 9999) return false;
            else return true;
        }

        function dhms (ms) {
            const days = Math.floor(ms / (24*60*60*1000));
            const daysms = ms % (24*60*60*1000);
            const hours = Math.floor(daysms / (60*60*1000));
            const hoursms = ms % (60*60*1000);
            const minutes = Math.floor(hoursms / (60*1000));
            const minutesms = ms % (60*1000);
            const sec = Math.floor(minutesms / 1000);
            return {
                days: days,
                hours: hours,
                minutes: minutes,
                seconds: sec
            };
        }
        
	},
};