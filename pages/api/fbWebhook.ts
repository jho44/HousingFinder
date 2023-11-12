import type { NextApiRequest, NextApiResponse } from "next";
import { extractEntitiesFromPost } from "lib/api/llm.ts";
import { collection } from "lib/api/mongo.ts";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<string>,
) {
  // post added to fb grp -- save to mongo and redis
  // simulate payload contents with this const var
  const payload = {
    updated_time: "2023-10-26T08:03:09+0000",
    message: `APARTMENT AVAILABLE ✨ SUBLEASE✨
    I looking for someone to sublease my 1bed 1bath private apartment
    Dates can be flexible as I initially took a long term lease  (flexible) The room comes with a loft full bed and a regular full bed with mattresses.  The house has parking, laundry, 
    The apartment is a fully furnished 1bed 1bath
    apartment Utilities include 
    High speed WiFi 
    Heater
    All kitchen utensils and appliances are installed,dish washer,in unit laundry,
    Cable ready refrigerator,microwave 
    And AC
    If you have any question message then we conclude and finalize`,
    id: "415336998925847_1798959273896939",
  };
  if (!payload.message.trim().length) {
    res.send("ok");
    return;
  }
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
