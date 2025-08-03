import { SlashCommandBuilder, EmbedBuilder, ChannelType, MessageFlags } from 'discord.js';
import { db } from '../connections/database.js';
import { stats } from '../functions/stats.js';
import { manageDates } from '../functions/manageDates.js';

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

        // Si on veut comparer un membre avec personne, ...
        if(!member && memberCompare) {
            member = memberCompare; // ...on le met en membre duquel on veut les stats
            memberCompare = null;
        }

        // Contrôle de la cohérence des données
        if(
            (periodeStart != null && !manageDates.controleFormatDate(periodeStart)) || 
            (periodeEnd != null && !manageDates.controleFormatDate(periodeEnd))
        ) {
            return await interaction.reply({
                content: `La date doit être au format JJ/MM/AAAA`,
                flags: MessageFlags.Ephemeral
            });
        }

        const command = {
            memberId: (!member) ? null : member.id,
            memberCompareId: (!memberCompare) ? null : memberCompare.id,
            channelId: (!channel) ? null : channel.id,
            periodeStart: (!periodeStart) ? null : periodeStart,
            periodeEnd: (!periodeEnd) ? null : periodeEnd,
            eventTypeId: "VCL",
            afkChannelId: interaction.guild.afkChannelId
        }

        // Exécution de la requête
        const rawData = await stats.query(command);

        // Traitement des données
        const data = await stats.dataTreatment(command, rawData);

        // Récupération de l'embed de réponse
        const reply = await stats.replyGeneration(command, data);

        // Réponse
        await interaction.reply(reply);
        

        
	},
};