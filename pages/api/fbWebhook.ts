import type { NextApiRequest, NextApiResponse } from "next";
import { extractEntitiesFromPost } from "../../lib/api/llm.ts";
import { collection } from "../../lib/api/mongo.ts";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<string>,
) {
  // post added to fb grp -- save to mongo and redis
  // simulate payload contents with this const var
  const payload = {
    updated_time: "2023-10-26T08:03:01+0000",
    message: `A private 1 BED 1 BATH is available for RENT
    The apartment is available for Long and Short term lease for $1200 monthly with the utilities included( fully equipped kitchen, living room, with parking spot available outdoor spaces and well furnished)
    Walking distance to UCLA also walking distance to grocery/retail store and public transportation 
    It is Available for Students, Workers and Couples, also this property is everything you need for comfortable stay. Send a DM with the screenshot of my post if you are interested`,
    id: "415336998925847_1795158304277036",
  };
  const logMetadata = { id: payload.id };
  const doc = {
    id: payload.id,
    msg: payload.message,
    updated_at: new Date(payload.updated_time),
  };
  try {
    Object.assign(doc, await extractEntitiesFromPost(payload));
  } catch (err) {
    // TODO: retries?
    console.error("Failed to extract entities from post", payload, err);
    return;
  }

  try {
    console.log(logMetadata, `Inserting ${JSON.stringify(doc)}`);
    await collection.insertOne(doc);
  } catch (err) {
    console.error(logMetadata, `Failed to insert ${JSON.stringify(doc)}`, err);
  }
  res.send("ok");
}
