const queue = [];

export default function handler(req, res) {
    if (req.method === "POST") {
        const { userId } = req.body || {};

        if (!userId) {
            return res.status(400).json({
                error: "userId manquant",
            });
        }

        queue.push({
            userId,
            createdAt: Date.now(),
        });

        return res.status(200).json({
            success: true,
        });
    }

    if (req.method === "GET") {
        return res.status(200).json({
            queue,
        });
    }

    return res.status(405).json({
        error: "Méthode non autorisée",
    });
}
