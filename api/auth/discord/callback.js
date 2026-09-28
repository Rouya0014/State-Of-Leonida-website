import crypto from "crypto";
import clientPromise from "../../lib/mongodb.js";

export default async function handler(req, res) {
    const { code, error } = req.query;

    const goHome = (status, checkId, name) => {
        let url = `/?auth=${status}`;

        if (checkId) {
            url += `&check=${encodeURIComponent(checkId)}`;
        }

        if (name) {
            url += `&name=${encodeURIComponent(name)}`;
        }

        res.setHeader("Cache-Control", "no-store");
        res.statusCode = 302;
        res.setHeader("Location", url);
        res.end();
    };

    if (error) {
        return goHome("cancelled");
    }

    if (!code) {
        return goHome("error");
    }

    try {
        // 1. Échange du code OAuth2 contre un token
        const params = new URLSearchParams({
            client_id: process.env.DISCORD_CLIENT_ID,
            client_secret: process.env.DISCORD_CLIENT_SECRET,
            grant_type: "authorization_code",
            code,
            redirect_uri:
                "https://stateofleonida.vercel.app/api/auth/discord/callback",
        });

        const tokenResponse = await fetch(
            "https://discord.com/api/oauth2/token",
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded",
                },
                body: params,
            }
        );

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            console.error("Erreur OAuth2 :", tokenData);
            return goHome("error");
        }

        // 2. Récupération du compte Discord
        const userResponse = await fetch(
            "https://discord.com/api/users/@me",
            {
                headers: {
                    Authorization:
                        `Bearer ${tokenData.access_token}`,
                },
            }
        );

        const user = await userResponse.json();

        if (!userResponse.ok) {
            console.error(
                "Erreur récupération utilisateur :",
                user
            );

            return goHome("error");
        }

        const username =
            user.global_name || user.username;

        // 3. Création d'un identifiant temporaire
        const checkId = crypto.randomBytes(32).toString("hex");

        // 4. Enregistrement de la demande
        const client = await clientPromise;
        const db = client.db();
        const collection = db.collection("oauth_queue");

        await collection.updateOne(
            { userId: user.id },
            {
                $set: {
                    userId: user.id,
                    checkId,
                    username,
                    status: "pending",
                    banned: null,
                    createdAt: new Date(),
                    processedAt: null,
                },
            },
            { upsert: true }
        );

        // 5. Retour immédiat sur le site
        return goHome(
            "checking",
            checkId,
            username
        );

    } catch (err) {
        console.error("Erreur :", err);
        return goHome("error");
    }
}
