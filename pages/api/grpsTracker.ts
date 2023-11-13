import type { NextApiRequest, NextApiResponse } from "next";
import { extractEntitiesFromPost } from "lib/api/llm.ts";
import { bayAreaCollection } from "lib/api/mongo.ts";
import { trimWhitespaceOnAllLines } from "@/lib/utils";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<string>,
) {
  if (req.body.type === "comments") {
    res.send("ok");
    return;
  }
  const log = trimWhitespaceOnAllLines(`
    ###### BODY START ######
    ${JSON.stringify(req.body)}
    ###### BODY END ######
  `);
  console.log(log);

  const {
    postID: id,
    post: msg,
    author: authorName,
    authorFacebookID,
    updated,
  } = req.body;
  const logMetadata = { id };
  const doc = {
    id,
    msg,
    updated_at: dayjs.utc(updated, "YYYY-MM-DD HH:mm:ss").toDate(),
    author: {
      name: authorName,
      id: authorFacebookID,
    },
  };

  try {
    Object.assign(doc, await extractEntitiesFromPost(req.body));
  } catch (err) {
    // TODO: retries?
    console.error("Failed to extract entities from post", req.body, err);
    return;
  }

  try {
    console.log(logMetadata, `Inserting ${JSON.stringify(doc)}`);
    await bayAreaCollection.insertOne(doc);
  } catch (err) {
    console.error(logMetadata, `Failed to insert ${JSON.stringify(doc)}`, err);
  }
  res.send("ok");
}
