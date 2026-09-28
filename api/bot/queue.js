import clientPromise from "../lib/mongodb.js";

function isAuthorized(req) {
    const auth = req.headers.authorization;

    return (
        auth &&
        auth === `Bearer ${process.env.BOT_API_KEY}`
    );
}

export default async function handler(req, res) {
    try {
        const client = await clientPromise;
        const db = client.db();
        const collection = db.collection("oauth_queue");

        /*
         * GET
         * Réservé au bot.
         * Récupère les demandes en attente.
         */
        if (req.method === "GET") {
            if (!isAuthorized(req)) {
                return res.status(401).json({
                    error: "Non autorisé.",
                });
            }

            const users = await collection
                .find({ status: "pending" })
                .sort({ createdAt: 1 })
                .limit(10)
                .toArray();

            return res.status(200).json({
                queue: users,
            });
        }

        /*
         * POST
         * Réservé au bot.
         *
         * Permet également au système existant
         * de créer une demande si nécessaire.
         */
        if (req.method === "POST") {
            if (!isAuthorized(req)) {
                return res.status(401).json({
                    error: "Non autorisé.",
                });
            }

            const { userId } = req.body || {};

            if (!userId) {
                return res.status(400).json({
                    error: "userId manquant.",
                });
            }

            await collection.updateOne(
                { userId },
                {
                    $set: {
                        userId,
                        createdAt: new Date(),
                        status: "pending",
                        banned: null,
                        processedAt: null,
                    },
                },
                { upsert: true }
            );

            return res.status(200).json({
                success: true,
            });
        }

        /*
         * PATCH
         * Réservé au bot.
         *
         * Le bot utilise cette route après avoir
         * vérifié le bannissement.
         */
        if (req.method === "PATCH") {
            if (!isAuthorized(req)) {
                return res.status(401).json({
                    error: "Non autorisé.",
                });
            }

            const {
                userId,
                status,
                banned,
            } = req.body || {};

            if (!userId || !status) {
                return res.status(400).json({
                    error:
                        "userId ou status manquant.",
                });
            }

            const update = {
                status,
                processedAt: new Date(),
            };

            if (typeof banned === "boolean") {
                update.banned = banned;
            }

            await collection.updateOne(
                { userId },
                {
                    $set: update,
                }
            );

            return res.status(200).json({
                success: true,
            });
        }

        /*
         * GET ?checkId=...
         *
         * Utilisé par le site.
         *
         * IMPORTANT :
         * aucune BOT_API_KEY n'est nécessaire ici.
         *
         * Le checkId est aléatoire et temporaire.
         */
        if (
            req.method === "GET" &&
            req.query.checkId
        ) {
            const { checkId } = req.query;

            const result = await collection.findOne(
                { checkId },
                {
                    projection: {
                        _id: 0,
                        checkId: 1,
                        username: 1,
                        status: 1,
                        banned: 1,
                    },
                }
            );

            if (!result) {
                return res.status(404).json({
                    error: "Vérification introuvable.",
                });
            }

            return res.status(200).json({
                success: true,
                status: result.status,
                banned: result.banned,
                username: result.username,
            });
        }

        return res.status(405).json({
            error: "Méthode non autorisée.",
        });

    } catch (error) {
        console.error(
            "MongoDB error :",
            error
        );

        return res.status(500).json({
            error: "Erreur serveur.",
        });
    }
}
