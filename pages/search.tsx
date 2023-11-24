import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import dayjs from "dayjs";
import getPosts from "@/lib/api/getPosts";
import { PAGE_SIZE, GRP_ID } from "@/lib/constants";
import {
  convertToDate,
  isWithinXDays,
  postsToSearchResults,
  getSearchResults,
} from "@/lib/utils";

import FilterBar from "../components/FilterBar/FilterBar";
import Spinner from "../components/Spinner/Spinner";

import styles from "../components/SearchSection.module.css";

import { useDebounce } from "../hooks/useDebounce";
import type { Gender, MoveDate, Post, PostType } from "../types";

// This gets called on every request
export async function getServerSideProps() {
  const { results: posts } = await getPosts({ pageNum: 0 });
  const serializablePosts = posts.map((post) => ({
    ...post,
    created_at: post.created_at.toISOString(),
  }));

  // Pass data to the page via props
  return { props: { firstPagePosts: serializablePosts } };
}

export default function Search({ firstPagePosts }: { firstPagePosts: Post[] }) {
  const [searchType, setSearchType] = useState<PostType | "all">("all");
  const [lowPrice, setLowPrice] = useState("");
  const [highPrice, setHighPrice] = useState("");
  const [moveInDate, setMoveInDate] = useState<MoveDate>(null);
  const [moveOutDate, setMoveOutDate] = useState<MoveDate>(null);
  const [gender, setGender] = useState<Gender>(null);
  const debouncedLowPrice = useDebounce(lowPrice, 1000);
  const debouncedHighPrice = useDebounce(highPrice, 1000);
  const [allPosts, setAllPosts] = useState(firstPagePosts);
  const [searchBarPosts, setSearchBarPosts] = useState(
    postsToSearchResults(allPosts),
  );
  const [filterBarHeight, setFilterBarHeight] = useState(0); // record of the filter bar height as window size changes
  const filterBarRef = useRef<HTMLDivElement>(null);
  const debouncedInputRef = useRef<string>("");

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

  const filteredPosts: Post[] = [];
  const lowPriceNum = debouncedLowPrice ? parseInt(debouncedLowPrice, 10) : 0;
  const highPriceNum = debouncedHighPrice
    ? parseInt(debouncedHighPrice, 10)
    : Infinity;
  const searchBarIds = new Set(Object.keys(searchBarPosts));
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
      if (postMoveInDate && !isWithinXDays(moveInDate, postMoveInDate, 1))
        return;
    }
    if (post.duration?.end && moveOutDate) {
      const postMoveOutDate = convertToDate(post.duration?.end, true);
      if (postMoveOutDate && !isWithinXDays(moveOutDate, postMoveOutDate, 1))
        return;
    }
    if (post.desired_gender && gender && post.desired_gender !== gender) return;

    // amenities?: string[];
    filteredPosts.push(post);
  });

  const contentEl = useRef<HTMLDivElement>(null);
  const scrolledToLastPage = allPosts.length % PAGE_SIZE > 0;
  const pageNum = useRef(1);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);

  const loadMorePosts = useCallback(async () => {
    if (scrolledToLastPage || loadingMorePosts) return;
    setLoadingMorePosts(true);
    const filters = {
      searchType,
      lowPrice,
      highPrice,
      moveInDate,
      moveOutDate,
      gender,
      keyword: debouncedInputRef.current,
    };
    const filtersStr = Object.entries(filters)
      .filter(([_, v]) => v)
      .map(([k, v]) => `${k}=${v}`)
      .join("&");
    const res = await fetch(
      `/api/getPosts?page=${pageNum.current}${
        filtersStr ? `&${filtersStr}` : ""
      }`,
    );
    const [{ results, lastPageNum }] = await res.json();
    const newPosts = results as Post[];
    pageNum.current = lastPageNum;
    const newPostsSerialized = newPosts.map((post) => ({
      ...post,
      created_at: new Date(post.created_at).toISOString(),
    })) as Post[];
    setAllPosts((prevPosts) => [...prevPosts, ...newPostsSerialized]);
    const newSearchResults = getSearchResults(
      debouncedInputRef.current,
      newPostsSerialized,
    );
    setSearchBarPosts((prevPosts) => ({
      ...prevPosts,
      ...newSearchResults,
    }));

    setTimeout(() => {
      setLoadingMorePosts(false);
    });
  }, [
    loadingMorePosts,
    scrolledToLastPage,
    gender,
    highPrice,
    lowPrice,
    moveInDate,
    moveOutDate,
    searchType,
  ]);

  const scrolled = useRef(false);
  const wheelAnimationFrame = useRef<number>();
  useEffect(() => {
    const currContentEl = contentEl.current;
    if (!currContentEl) return;
    const handleScroll = async (e: Event) => {
      scrolled.current = true;
      if (e.currentTarget instanceof HTMLDivElement) {
        if (
          e.currentTarget.scrollTop ===
          e.currentTarget.scrollHeight - e.currentTarget.offsetHeight
        ) {
          // at btm of feed
          await loadMorePosts();
        }
      }
    };

    const handleWheel = async (e: WheelEvent) => {
      // load more posts if e.deltaY > 0 and handleScroll not triggered
      if (wheelAnimationFrame.current)
        cancelAnimationFrame(wheelAnimationFrame.current);

      // Schedule a new function call using requestAnimationFrame
      wheelAnimationFrame.current = requestAnimationFrame(async () => {
        if (scrolled.current) return;
        if (0 <= e.deltaY && e.deltaY <= 1) await loadMorePosts();
        scrolled.current = false;
      });
    };

    currContentEl.addEventListener("scroll", handleScroll);
    currContentEl.addEventListener("wheel", handleWheel);
    return () => {
      currContentEl.removeEventListener("scroll", handleScroll);
      currContentEl.removeEventListener("wheel", handleWheel);
    };
  }, [loadMorePosts]);

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
        debouncedInputRef={debouncedInputRef}
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
            const ogPostLink = `https://www.facebook.com/groups/${GRP_ID}/posts/${postId}/`;
            return (
              <div
                key={post.id}
                className="flex flex-col gap-3 py-3 px-4 rounded-lg max-w-full break-words sm:w-full sm:max-w-[680px] bg-dark-900"
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
                {searchBarPosts[post.id]?.start === undefined ? (
                  post.msg
                ) : (
                  <div>
                    <span>
                      {post.msg.slice(0, searchBarPosts[post.id].start)}
                    </span>
                    <span className="bg-bright-600">
                      {post.msg.slice(
                        searchBarPosts[post.id].start,
                        searchBarPosts[post.id].end,
                      )}
                    </span>
                    <span>{post.msg.slice(searchBarPosts[post.id].end)}</span>
                  </div>
                )}
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
