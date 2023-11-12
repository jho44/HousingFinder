import { MongoClient } from "mongodb";

const { MONGO_PWD, MONGO_USERNAME } = process.env;

const mongoUrl = `mongodb+srv://${MONGO_USERNAME}:${MONGO_PWD}@cluster0.rtjso8g.mongodb.net/?retryWrites=true&w=majority`;
export const mongoClient = new MongoClient(mongoUrl);

export async function connectToMongo() {
  try {
    await mongoClient.connect();
    console.log("Successfully connected to Atlas");
  } catch (err) {
    if (err instanceof Error) console.log("MONGO CONNECT FAILED", err.stack);
  }
}

export const db = mongoClient.db("UclaHousing");
export const collection = db.collection("ExtractedEntities");
