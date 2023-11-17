import type { NextApiRequest, NextApiResponse } from "next";
import { extractEntitiesFromPost } from "@/lib/api/llm.ts";
import { sfCollection } from "@/lib/api/mongo.ts";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<string>,
) {
  const body = req.body;
  if (body.type === "comments") {
    res.send("ok");
    return;
  }
  const log = `###### BODY START ######
${JSON.stringify(body)}
###### BODY END ######`;
  console.log(log);

  const {
    postID: id,
    post: msg,
    author: authorName,
    authorFacebookID,
    updated,
  } = body;
  const logMetadata = { id };
  const doc = {
    id,
    msg,
    created_at: dayjs.utc(updated, "YYYY-MM-DD HH:mm:ss").toDate(),
    author: {
      name: authorName,
      id: authorFacebookID,
    },
  };

  try {
    Object.assign(doc, await extractEntitiesFromPost(body));
  } catch (err) {
    // TODO: retries?
    console.error("Failed to extract entities from post", body, err);
    return;
  }

  try {
    console.log(logMetadata, `Inserting ${JSON.stringify(doc)}`);
    await sfCollection.insertOne(doc);
  } catch (err) {
    console.error(logMetadata, `Failed to insert ${JSON.stringify(doc)}`, err);
  }
  res.send("ok");
}
