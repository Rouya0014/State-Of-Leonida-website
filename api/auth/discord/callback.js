export default async function handler(req, res) {
    const { code } = req.query;

    if (!code) {
        return res.status(400).send("Code OAuth2 manquant.");
    }

    try {
        // 1. Échange du code OAuth2 contre un token
        const params = new URLSearchParams({
            client_id: process.env.DISCORD_CLIENT_ID,
            client_secret: process.env.DISCORD_CLIENT_SECRET,
            grant_type: "authorization_code",
            code,
            redirect_uri: "https://stateofleonida.vercel.app/api/auth/discord/callback",
        });

        const tokenResponse = await fetch(
            "https://discord.com/api/oauth2/token",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: params,
            }
        );

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            console.error("Erreur OAuth2 :", tokenData);
            return res.status(500).send("Erreur lors de la connexion à Discord.");
        }

        // 2. Récupération du compte Discord
        const userResponse = await fetch(
            "https://discord.com/api/users/@me",
            {
                headers: {
                    Authorization: `Bearer ${tokenData.access_token}`,
                },
            }
        );

        const user = await userResponse.json();

        if (!userResponse.ok) {
            console.error("Erreur récupération utilisateur :", user);
            return res.status(500).send("Impossible de récupérer votre compte Discord.");
        }

        // 3. Ajout dans la file du bot
        const queueResponse = await fetch(
            "https://stateofleonida.vercel.app/api/bot/queue",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: user.id,
                }),
            }
        );

        if (!queueResponse.ok) {
            console.error("Erreur ajout à la queue :", await queueResponse.text());
            return res.status(500).send("Impossible de contacter le système du bot.");
        }

        // 4. Confirmation
        res.status(200).send(`
            <h1>Connexion Discord réussie !</h1>
            <p>Bienvenue ${user.global_name || user.username}.</p>
            <p>Le bot va maintenant vous contacter en message privé.</p>
        `);

    } catch (error) {
        console.error("Erreur :", error);
        res.status(500).send("Une erreur est survenue.");
    }
}
