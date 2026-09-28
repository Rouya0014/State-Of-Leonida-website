export default function handler(req, res) {
    const params = new URLSearchParams({
        client_id: "819614914657386526",
        response_type: "code",
        redirect_uri: "https://stateofleonida.vercel.app/api/auth/discord/callback",
        scope: "identify",
    });

    res.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
}
