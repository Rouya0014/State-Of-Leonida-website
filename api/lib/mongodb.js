import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
    throw new Error("MONGODB_URI n'est pas configurée.");
}

const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
});

let clientPromise = global._mongoClientPromise;

if (!clientPromise) {
    clientPromise = client.connect();
    global._mongoClientPromise = clientPromise;
}

export default clientPromise;
