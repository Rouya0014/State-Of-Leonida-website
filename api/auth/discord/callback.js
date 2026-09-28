export default async function handler(req, res) {
    const { code, error } = req.query;

    // Renvoie le visiteur sur la page d'accueil, où le pop-up s'affiche
    const goHome = (status, name) => {
        let url = `/?auth=${status}`;
        if (name) url += `&name=${encodeURIComponent(name)}`;
        res.setHeader("Cache-Control", "no-store");
        res.statusCode = 302;
        res.setHeader("Location", url);
        res.end();
    };

    // Connexion annulée sur la page Discord
    if (error) return goHome("cancelled");
    if (!code) return goHome("error");

    try {
        // 1. Échange du code OAuth2 contre un token
        const params = new URLSearchParams({
            client_id: process.env.DISCORD_CLIENT_ID,
            client_secret: process.env.DISCORD_CLIENT_SECRET,
            grant_type: "authorization_code",
            code,
            redirect_uri: "https://stateofleonida.vercel.app/api/auth/discord/callback",
        });

        const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params,
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            console.error("Erreur OAuth2 :", tokenData);
            return goHome("error");
        }

        // 2. Récupération du compte Discord
        const userResponse = await fetch("https://discord.com/api/users/@me", {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });

        const user = await userResponse.json();

        if (!userResponse.ok) {
            console.error("Erreur récupération utilisateur :", user);
            return goHome("error");
        }

        // 3. Ajout dans la file du bot
        const queueResponse = await fetch("https://stateofleonida.vercel.app/api/bot/queue", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.BOT_API_KEY}`,
            },
            body: JSON.stringify({ userId: user.id }),
        });

        if (!queueResponse.ok) {
            console.error("Erreur ajout à la queue :", await queueResponse.text());
            return goHome("error");
        }

        // 4. Confirmation : retour à l'accueil avec le pop-up
        return goHome("success", user.global_name || user.username);

    } catch (err) {
        console.error("Erreur :", err);
        return goHome("error");
    }
}
