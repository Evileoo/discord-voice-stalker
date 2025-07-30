import { SlashCommandBuilder, EmbedBuilder, ChannelType, MessageFlags } from 'discord.js';
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
	, async execute(interaction) {

        // Récupération des données
        let member = interaction.options.getUser("membre");
        let channel = interaction.options.getChannel("channel");
        let memberCompare = interaction.options.getUser("membre_compare");

        // Si on veut comparer un membre avec personne
        if(!member && memberCompare) {
            member = memberCompare; // On le met en membre duquel on veut les stats
        }

        const timeInVoice = await db.query(`
            WITH joined_events AS (
              SELECT
                event_id AS join_event_id,
                user_id,
                user_name,
                joined_tms
              FROM user_voice_event
              WHERE joined_tms IS NOT NULL
            ),
            left_events AS (
              SELECT
                event_id AS left_event_id,
                user_id,
                left_tms
              FROM user_voice_event
              WHERE left_tms IS NOT NULL
            ),
            paired_sessions AS (
              SELECT
                j.user_id,
                j.user_name,
                j.joined_tms,
                l.left_tms,
                TIMESTAMPDIFF(SECOND, j.joined_tms, l.left_tms) AS duration_seconds
              FROM joined_events j
              JOIN left_events l
                ON j.user_id = l.user_id
                AND l.left_tms > j.joined_tms
              WHERE NOT EXISTS (
                SELECT 1 FROM left_events l2
                WHERE l2.user_id = j.user_id
                  AND l2.left_tms > j.joined_tms
                  AND l2.left_tms < l.left_tms
              )
            ),
            open_sessions AS (
              SELECT
                j.user_id,
                j.user_name,
                j.joined_tms,
                NULL AS left_tms,
                TIMESTAMPDIFF(SECOND, j.joined_tms, NOW()) AS duration_seconds
              FROM joined_events j
              WHERE NOT EXISTS (
                SELECT 1 FROM left_events l
                WHERE l.user_id = j.user_id
                  AND l.left_tms > j.joined_tms
              )
            ),
            all_sessions AS (
              SELECT * FROM paired_sessions
              UNION ALL
              SELECT * FROM open_sessions
            )
            SELECT
              user_id,
              user_name,
              CONCAT(
                FLOOR(SUM(duration_seconds) / 86400), 'j ',
                TIME_FORMAT(SEC_TO_TIME(SUM(duration_seconds) % 86400), '%H:%i:%s')
              ) AS total_time_vocal,
              SUM(duration_seconds) AS total_seconds,
              CASE WHEN EXISTS (
                SELECT 1 FROM open_sessions o WHERE o.user_id = all_sessions.user_id
              ) THEN 1 ELSE 0 END AS is_currently_in_voice
            FROM all_sessions
            GROUP BY user_id, user_name
            ORDER BY total_seconds DESC
        `);

        let rankSentance = ``;
        let userSentance = ``;
        let timeSentance = ``;
        for(let i = 1; i <= timeInVoice.length; i++) {
            rankSentance += `**${i}.**\n`;
            userSentance += `<@${timeInVoice[i-1].user_id}>\n`;
            timeSentance += `${timeInVoice[i-1].total_time_vocal}\n`;
        }

        const embed = new EmbedBuilder()
        .setTitle("TOP 10")
        .setDescription("du temps passé en vocal")
        .setTimestamp()
        .addFields(
            { name: `Rang`, value: `${rankSentance}`, inline: true },
            { name: `Membre`, value: `${userSentance}`, inline: true },
            { name: `Temps`, value: `${timeSentance}`, inline: true },
        )

        


        await interaction.reply({
            embeds: [embed],
        });
	},
};