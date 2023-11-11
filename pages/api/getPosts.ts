import type { NextApiRequest, NextApiResponse } from "next";
import getPosts from "lib/api/getPosts";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ [key: string]: any }[] | string>,
) {
  const page = "page" in req.query ? req.query.page : "0";
  if (!page || typeof page !== "string") {
    res.status(400).send("Invalid page queried");
    return;
  }
  const pageNum = parseInt(page, 10);
  const docs = await getPosts(pageNum);
  res.json(docs);
}
