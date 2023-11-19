import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import dayjs from "dayjs";
import getPosts from "@/lib/api/getPosts";
import { PAGE_SIZE, GRP_ID } from "@/lib/constants";
import { convertToDate, isWithin16Days } from "@/lib/utils";

import FilterBar from "../components/FilterBar/FilterBar";
import Spinner from "../components/Spinner/Spinner";

import styles from "../components/SearchSection.module.css";

import { useDebounce } from "../hooks/useDebounce";
import { Gender, MoveDate, Post } from "../types";

// This gets called on every request
export async function getServerSideProps() {
  const posts = await getPosts(0);
  const serializablePosts = posts.map((post) => ({
    ...post,
    created_at: post.created_at.toISOString(),
  }));

  // Pass data to the page via props
  return { props: { firstPagePosts: serializablePosts } };
}

export default function Search({ firstPagePosts }: { firstPagePosts: Post[] }) {
  const [searchType, setSearchType] = useState("all");
  const [lowPrice, setLowPrice] = useState("");
  const [highPrice, setHighPrice] = useState("");
  const [moveInDate, setMoveInDate] = useState<MoveDate>(null);
  const [moveOutDate, setMoveOutDate] = useState<MoveDate>(null);
  const [gender, setGender] = useState<Gender>(null);
  const debouncedLowPrice = useDebounce(lowPrice, 1000);
  const debouncedHighPrice = useDebounce(highPrice, 1000);
  const [allPosts, setAllPosts] = useState(firstPagePosts);
  const [filteredPosts, setFilteredPosts] = useState(allPosts);
  const [searchBarPosts, setSearchBarPosts] = useState(allPosts);
  const [filterBarHeight, setFilterBarHeight] = useState(0); // record of the filter bar height as window size changes
  const filterBarRef = useRef<HTMLDivElement>(null);

  const updateFilterBarHeight = () => {
    if (filterBarRef.current) {
      const height = filterBarRef.current.clientHeight;
      setFilterBarHeight(height);
    }
  };

  useEffect(() => {
    updateFilterBarHeight();
  }, [searchType, lowPrice, highPrice, moveInDate, moveOutDate, gender]);

  useEffect(() => {
    const handleResize = () => {
      updateFilterBarHeight();
    };

    updateFilterBarHeight();

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    let posts: Post[] = [];
    const lowPriceNum = debouncedLowPrice ? parseInt(debouncedLowPrice, 10) : 0;
    const highPriceNum = debouncedHighPrice
      ? parseInt(debouncedHighPrice, 10)
      : Infinity;
    const searchBarIds = new Set(searchBarPosts.map((p) => p.id));
    allPosts.forEach((post) => {
      if (
        (searchType === "searching_for" &&
          post.post_type !== "searching_for_lease") ||
        (searchType === "offering" && post.post_type !== "offering_lease")
      )
        return;
      if (!searchBarIds.has(post.id)) return;
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
    setFilteredPosts(posts);
  }, [
    searchType,
    debouncedLowPrice,
    debouncedHighPrice,
    moveInDate,
    moveOutDate,
    allPosts,
    gender,
    searchBarPosts,
  ]);

  const contentEl = useRef<HTMLDivElement>(null);
  const scrolledToLastPage = allPosts.length % PAGE_SIZE > 0;
  const pageNum = useRef(0);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);
  useEffect(() => {
    const currContentEl = contentEl.current;
    if (!currContentEl) return;
    const handleScroll = async (e: Event) => {
      if (e.currentTarget instanceof HTMLDivElement) {
        if (
          e.currentTarget.scrollTop ===
          e.currentTarget.scrollHeight - e.currentTarget.offsetHeight
        ) {
          // at btm of feed
          if (scrolledToLastPage) return;
          setLoadingMorePosts(true);
          pageNum.current = pageNum.current + 1;
          const res = await fetch(`/api/getPosts?page=${pageNum.current}`);
          const newPosts = (await res.json()) as Post[];
          const newPostsSerialized = newPosts.map((post) => ({
            ...post,
            created_at: new Date(post.created_at).toISOString(),
          })) as Post[];
          setLoadingMorePosts(false);
          setAllPosts((prevPosts) => [...prevPosts, ...newPostsSerialized]);
          setFilteredPosts((prevPosts) => [
            ...prevPosts,
            ...newPostsSerialized,
          ]);
          setSearchBarPosts((prevPosts) => [
            ...prevPosts,
            ...newPostsSerialized,
          ]);
        }
      }
    };

    currContentEl.addEventListener("scroll", handleScroll);
    return () => currContentEl.removeEventListener("scroll", handleScroll);
  }, [allPosts, scrolledToLastPage, filteredPosts]);

  if (!allPosts) return <div>Loading...</div>;
  return (
    <div
      className={`${styles["search-section"]} h-full overflow-y-scroll`}
      ref={contentEl}
    >
      <FilterBar
        ref={filterBarRef}
        allPosts={allPosts}
        posts={filteredPosts}
        lowPrice={lowPrice}
        highPrice={highPrice}
        searchType={searchType}
        moveInDate={moveInDate}
        moveOutDate={moveOutDate}
        gender={gender}
        setPosts={setSearchBarPosts}
        setSearchType={setSearchType}
        setLowPrice={setLowPrice}
        setHighPrice={setHighPrice}
        setMoveInDate={setMoveInDate}
        setMoveOutDate={setMoveOutDate}
        setGender={setGender}
      />
      <div
        className="flex flex-col items-center px-4 pb-4 gap-4"
        style={{ paddingTop: `calc(${filterBarHeight}px + 16px)` }}
      >
        {filteredPosts.length ? (
          filteredPosts.map((post) => {
            const postId = post.id;
            const createdDatetime = dayjs(post.created_at);
            const ogPostLink = `https://www.facebook.com/groups/${GRP_ID}/posts/${postId}/`;
            return (
              <div
                key={post.id}
                className="flex flex-col gap-3 py-3 px-4 rounded-lg max-w-full break-words sm:max-w-[680px] bg-dark-900"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {post.author.id ? (
                      <a
                        href={`https://www.facebook.com/${post.author.id}`}
                        target="_blank"
                      >
                        <Image
                          src={post.author.profileImgUrl}
                          alt={`${post.author.name} profile image`}
                          height={40}
                          width={40}
                          className="rounded-full w-10 h-10"
                        />
                      </a>
                    ) : (
                      <Image
                        src={post.author.profileImgUrl}
                        alt={`${post.author.name} profile image`}
                        height={40}
                        width={40}
                        className="rounded-full w-10 h-10"
                      />
                    )}
                    <div className="flex flex-col gap-0.5">
                      {post.author.id ? (
                        <a
                          href={`https://www.facebook.com/${post.author.id}`}
                          className="font-bold w-fit"
                          target="_blank"
                        >
                          {post.author.name}
                        </a>
                      ) : (
                        <p className="font-bold">{post.author.name}</p>
                      )}
                      <a
                        href={ogPostLink}
                        className="w-fit text-sm text-dark-300"
                        target="_blank"
                      >
                        {dayjs(post.created_at).format("MMM D")}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center justify-center cursor-pointer w-9 h-9 rounded-full hover:bg-dark-700">
                    <a href={ogPostLink} target="_blank">
                      <Image
                        src="/icons/another-tab.svg"
                        height={0}
                        width={0}
                        alt={"Original post"}
                        className="w-5 min-w-[20px] h-auto"
                      />
                    </a>
                  </div>
                </div>
                {post.msg}
              </div>
            );
          })
        ) : (
          <p className="text-dark-200 text-lg">No posts available</p>
        )}
        {loadingMorePosts && <Spinner />}
        {scrolledToLastPage && (
          <p className="text-dark-200 text-lg">No more posts</p>
        )}
      </div>
    </div>
  );
}
