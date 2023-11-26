/*
TODO: to be turned into cron job rather than webhook handler
*/
import type { NextApiRequest, NextApiResponse } from "next";
import { sfCollection2 } from "@/lib/api/mongo.ts";
import { extractEntitiesFromPost } from "@/lib/api/llm";
import fs from "fs";

type ReceivedPost = {
  postID: string;
  post: string;
  author: string;
  authorFacebookID: string | null;
  created: string;
  profileImgUrl: string;
};

type DBPost = {
  id: string;
  msg: string;
  created_at: Date;
  author: {
    name: string;
    id: string | undefined;
    profileImgUrl: string;
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<string>,
) {
  const posts: ReceivedPost[] = JSON.parse(
    fs.readFileSync(`${process.cwd()}/lib/scrape/posts.json`, {
      encoding: "utf8",
    }),
  );

  const formattedPosts = await Promise.all(
    posts
      .filter((post) => post.postID !== "https:")
      .map(async (post) => {
        if (await sfCollection2.findOne({ id: post.postID })) {
          console.log(`SKIPPED ${post.postID}`);
          return null;
        }
        const doc = {
          id: post.postID,
          msg: post.post,
          created_at: new Date(post.created),
          author: {
            name: post.author,
            id: post.authorFacebookID,
            profileImgUrl: post.profileImgUrl,
          },
        };

        try {
          Object.assign(doc, await extractEntitiesFromPost(post));
        } catch (err) {
          // TODO: retries?
          console.error("Failed to extract entities from post", post, err);
          return null;
        }
        console.log(`ADDED ${post.postID}`);
        return doc;
      }),
  );

  await sfCollection2.insertMany(formattedPosts.filter(Boolean) as DBPost[]);
  console.log("DONE!");
  res.send("ok");
}
