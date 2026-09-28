export default async function handler(req, res) {
    const { code } = req.query;

    if (!code) {
        return res.status(400).send("Code OAuth2 manquant.");
    }

    res.status(200).send(`
        <h1>Connexion Discord réussie !</h1>
        <p>Le code OAuth2 a bien été reçu.</p>
    `);
}
