import type { NextApiRequest, NextApiResponse } from "next";
import { extractEntitiesFromPost } from "lib/api/llm.ts";
import { collection } from "lib/api/mongo.ts";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<string>,
) {
  console.log(req);
  res.send("ok");
}
