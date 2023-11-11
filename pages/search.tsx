import { useState, useEffect } from "react";
import dayjs from "dayjs";
import getPosts from "../lib/api/getPosts";

import FilterBar from "../components/FilterBar";

import styles from "../components/SearchSection.module.css";

import { useDebounce } from "../hooks/useDebounce";
import { convertToDate, isWithin16Days } from "../lib/utils";
import { Gender, MoveDate, Post } from "../types";

// This gets called on every request
export async function getServerSideProps() {
  const posts = await getPosts(0);
  const serializablePosts = posts.map((post) => ({
    ...post,
    updated_at: post.updated_at.toISOString(),
  }));

  // Pass data to the page via props
  return { props: { allPosts: serializablePosts } };
}

export default function Home({ allPosts }: { allPosts: Post[] }) {
  const [searchType, setSearchType] = useState("all");
  const [lowPrice, setLowPrice] = useState("");
  const [highPrice, setHighPrice] = useState("");
  const [moveInDate, setMoveInDate] = useState<MoveDate>(null);
  const [moveOutDate, setMoveOutDate] = useState<MoveDate>(null);
  const [gender, setGender] = useState<Gender>(null);
  const debouncedLowPrice = useDebounce(lowPrice, 1000);
  const debouncedHighPrice = useDebounce(highPrice, 1000);
  const [filteredPosts, setFilteredMsgs] = useState(allPosts);
  if (!allPosts) return <div>Loading...</div>;

  useEffect(() => {
    let posts: Post[] = [];
    const lowPriceNum = debouncedLowPrice ? parseInt(debouncedLowPrice, 10) : 0;
    const highPriceNum = debouncedHighPrice
      ? parseInt(debouncedHighPrice, 10)
      : Infinity;
    allPosts.forEach((post) => {
      if (
        (searchType === "searching_for" &&
          post.post_type !== "searching_for_lease") ||
        (searchType === "offering" && post.post_type !== "offering_lease")
      )
        return;
      if (lowPriceNum > (post.price_range?.low ?? Infinity)) return;
      if (highPriceNum < (post.price_range?.high ?? 0)) return;
      if (post.duration?.start && moveInDate) {
        const postMoveInDate = convertToDate(post.duration?.start, true);
        if (postMoveInDate && !isWithin16Days(moveInDate, postMoveInDate))
          return;
      }
      if (post.duration?.end && moveOutDate) {
        const postMoveOutDate = convertToDate(post.duration?.end, true);
        if (postMoveOutDate && !isWithin16Days(moveOutDate, postMoveOutDate))
          return;
      }
      if (post.desired_gender && gender && post.desired_gender !== gender)
        return;

      // amenities?: string[];
      posts.push(post);
    });
    setFilteredMsgs(posts);
  }, [
    searchType,
    debouncedLowPrice,
    debouncedHighPrice,
    moveInDate,
    moveOutDate,
  ]);

  const yesterday = dayjs().subtract(1, "day").startOf("day");
  return (
    <div className={`${styles["search-section"]}`}>
      <FilterBar
        allPosts={allPosts}
        posts={filteredPosts}
        lowPrice={lowPrice}
        highPrice={highPrice}
        searchType={searchType}
        moveInDate={moveInDate}
        moveOutDate={moveOutDate}
        gender={gender}
        setPosts={setFilteredMsgs}
        setSearchType={setSearchType}
        setLowPrice={setLowPrice}
        setHighPrice={setHighPrice}
        setMoveInDate={setMoveInDate}
        setMoveOutDate={setMoveOutDate}
        setGender={setGender}
      />
      <div className="flex flex-col items-center px-4 pb-4 gap-4 pt-[calc(var(--bar-height)+16px)]">
        {filteredPosts.length ? (
          filteredPosts.map((post) => {
            const [grpId, postId] = post.id.split("_");
            const updatedDatetime = dayjs(post.updated_at);
            const ogPostLink = `https://www.facebook.com/groups/${grpId}/posts/${postId}/`;
            return (
              <div
                key={post.id}
                className="flex flex-col gap-3 py-3 px-4 rounded-lg max-w-[680px] bg-dark-900"
              >
                <div className="flex justify-between items-center">
                  {/* "flex flex-row-reverse gap-2.5 " */}
                  <a
                    href={ogPostLink}
                    className="font-bold w-fit"
                    target="_blank"
                  >
                    Original post
                  </a>
                  <a
                    href={ogPostLink}
                    className="w-fit text-sm text-dark-300"
                    target="_blank"
                  >
                    {updatedDatetime.isBefore(yesterday)
                      ? dayjs(post.updated_at).format("MMM D")
                      : dayjs(post.updated_at).format("MMM D [at] h:mm A")}
                  </a>
                </div>
                {post.msg}
              </div>
            );
          })
        ) : (
          <p className="text-dark-200 text-lg">No posts available</p>
        )}
      </div>
    </div>
  );
}
