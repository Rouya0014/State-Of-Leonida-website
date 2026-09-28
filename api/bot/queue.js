import clientPromise from "../lib/mongodb.js";

export default async function handler(req, res) {
    try {
        const client = await clientPromise;
        const db = client.db();

        const collection = db.collection("oauth_queue");

        if (req.method === "POST") {
            const { userId } = req.body || {};

            if (!userId) {
                return res.status(400).json({
                    error: "userId manquant",
                });
            }

            await collection.updateOne(
                { userId },
                {
                    $set: {
                        userId,
                        createdAt: new Date(),
                        status: "pending",
                    },
                },
                { upsert: true }
            );

            return res.status(200).json({
                success: true,
            });
        }

        if (req.method === "GET") {
            const users = await collection
                .find({ status: "pending" })
                .sort({ createdAt: 1 })
                .toArray();

            return res.status(200).json({
                queue: users,
            });
        }

        return res.status(405).json({
            error: "Méthode non autorisée",
        });

    } catch (error) {
        console.error("MongoDB error :", error);

        return res.status(500).json({
            error: "Erreur serveur.",
        });
    }
}
