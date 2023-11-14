import type { NextApiRequest, NextApiResponse } from "next";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<string>,
) {
  console.log(req.headers);
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
  const doc = {
    id,
    msg,
    created_at: dayjs.utc(updated, "YYYY-MM-DD HH:mm:ss").toDate(),
    author: {
      name: authorName,
      id: authorFacebookID,
    },
  };
  console.log(doc);
  res.send("ok");
}
