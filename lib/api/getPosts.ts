import { collection } from "./mongo.ts";

const PAGE_SIZE = 20;
export default async function getPosts(pageNum: number) {
  const query = collection
    .find({})
    .sort({ updated_at: -1 })
    .limit(PAGE_SIZE)
    .skip(pageNum * PAGE_SIZE)
    .project({
      _id: 0,
    });
  return await query.toArray();
}
