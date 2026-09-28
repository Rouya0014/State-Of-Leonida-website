export default function handler(req, res) {
    const params = new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        response_type: "code",
        redirect_uri: "https://stateofleonida.vercel.app/api/auth/discord/callback",
        scope: "identify",
    });

    res.redirect(
        `https://discord.com/oauth2/authorize?${params.toString()}`
    );
}
