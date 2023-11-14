import { sfCollection } from "./mongo.ts";
import { PAGE_SIZE } from "@/lib/constants";

export default async function getPosts(pageNum: number) {
  const query = sfCollection
    .find({})
    .sort({ created_at: -1 })
    .limit(PAGE_SIZE)
    .skip(pageNum * PAGE_SIZE)
    .project({
      _id: 0,
    });
  return await query.toArray();
}
