import { useState, useEffect, useRef, useCallback } from "react";
import getPosts from "@/lib/api/getPosts";
import { PAGE_SIZE } from "@/lib/constants";
import { postsToSearchResults, getSearchResults } from "@/lib/utils";

import FilterBar from "../components/FilterBar/FilterBar";

import styles from "../components/SearchSection.module.css";

import { useDebounce } from "../hooks/useDebounce";
import type { Gender, MoveDate, Post, PostTypeFilter } from "../types";
import {
  satisfiesGender,
  satisfiesHighPrice,
  satisfiesLowPrice,
  satisfiesMoveInDate,
  satisfiesMoveOutDate,
  satisfiesSearchType,
} from "@/lib/filterUtils";
import Posts from "@/components/Posts";

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
  const [searchType, setSearchType] = useState<PostTypeFilter>("all");
  const [lowPrice, setLowPrice] = useState("");
  const [highPrice, setHighPrice] = useState("");
  const [moveInDate, setMoveInDate] = useState<MoveDate>(null);
  const [moveOutDate, setMoveOutDate] = useState<MoveDate>(null);
  const [gender, setGender] = useState<Gender>(null);
  const debouncedLowPrice = useDebounce(lowPrice, 1000);
  const debouncedHighPrice = useDebounce(highPrice, 1000);
  const [allPosts, setAllPosts] = useState(firstPagePosts);
  const [filterBarHeight, setFilterBarHeight] = useState(0); // record of the filter bar height as window size changes
  const [input, setInput] = useState("");
  const debouncedInput = useDebounce(input, 1000);
  const filterBarRef = useRef<HTMLDivElement>(null);
  const postsContainer = useRef<HTMLDivElement>(null);

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
  const searchBarPosts = getSearchResults(debouncedInput, allPosts);
  const searchBarIds = debouncedInput
    ? new Set(Object.keys(searchBarPosts))
    : null;
  allPosts.forEach((post) => {
    if (!satisfiesSearchType(searchType, post.post_type)) return;
    if (searchBarIds && !searchBarIds.has(post.id)) return;
    if (
      !satisfiesLowPrice(
        debouncedLowPrice,
        post.price_range?.low,
        post.price_range?.high,
      )
    )
      return;
    if (
      !satisfiesHighPrice(
        debouncedHighPrice,
        post.price_range?.low,
        post.price_range?.high,
      )
    )
      return;
    if (!satisfiesMoveInDate(moveInDate, post.duration?.start)) return;
    if (!satisfiesMoveOutDate(moveOutDate, post.duration?.end)) return;
    if (!satisfiesGender(gender, post.desired_gender)) return;

    // amenities?: string[];
    filteredPosts.push(post);
  });

  const contentEl = useRef<HTMLDivElement>(null);
  const scrolledToLastPage = allPosts.length % PAGE_SIZE > 0;
  const pageNum = useRef(1);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);

  const loadMorePosts = useCallback(async () => {
    // conditioning on loadingRef rather than loadingMorePosts since loadMorePosts might be called twice quickly
    // and the second run would still use old value of loadingMorePosts -- debouncing didn't help or maybe i just implemented it incorrectly
    if (scrolledToLastPage || loadingRef.current) return;
    loadingRef.current = true;
    setLoadingMorePosts(true);
    const filters = {
      searchType,
      lowPrice: debouncedLowPrice,
      highPrice: debouncedHighPrice,
      moveInDate,
      moveOutDate,
      gender,
      keyword: debouncedInput,
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

    const [{ results, nextPageNum }] = await res.json();
    const newPosts = results as Post[];
    pageNum.current = nextPageNum;

    // don't include any repeats from accidentally fetching same page more than once
    const newPostsSerialized: Post[] = [];
    const postIds = new Set(allPosts.map(({ id }) => id));
    newPosts.forEach((post) => {
      if (postIds.has(post.id)) return;
      newPostsSerialized.push({
        ...post,
        created_at: new Date(post.created_at).toISOString(),
      });
    });

    setAllPosts((prevPosts) => [...prevPosts, ...newPostsSerialized]);
    setTimeout(() => {
      setLoadingMorePosts(false);
      loadingRef.current = false;
    });
  }, [
    debouncedInput,
    allPosts,
    scrolledToLastPage,
    gender,
    debouncedHighPrice,
    debouncedLowPrice,
    moveInDate,
    moveOutDate,
    searchType,
  ]);

  const loadingRef = useRef(false);
  const handleScroll = useCallback(
    async (e: Event) => {
      if (
        e.currentTarget instanceof HTMLDivElement &&
        e.currentTarget.scrollTop ===
          e.currentTarget.scrollHeight - e.currentTarget.offsetHeight
      ) {
        // at btm of feed
        await loadMorePosts();
      }
    },
    [loadMorePosts],
  );

  const handleWheel = useCallback(
    async (e: Event) => {
      // on wheel, load more posts if the container’s height is less than page height
      if (!postsContainer.current) return;
      if (postsContainer.current.clientHeight < window.innerHeight) {
        e.stopImmediatePropagation();
        await loadMorePosts();
      }
    },
    [loadMorePosts],
  );

  useEffect(() => {
    const currContentEl = contentEl.current;
    if (!currContentEl) return;

    currContentEl.addEventListener("scroll", handleScroll);
    currContentEl.addEventListener("wheel", handleWheel);
    return () => {
      currContentEl.removeEventListener("scroll", handleScroll);
      currContentEl.removeEventListener("wheel", handleWheel);
    };
  }, [handleScroll, handleWheel]);

  if (!allPosts) return <div>Loading...</div>;
  return (
    <div
      className={`${styles["search-section"]} h-full overflow-y-scroll`}
      ref={contentEl}
    >
      <FilterBar
        ref={filterBarRef}
        lowPrice={lowPrice}
        highPrice={highPrice}
        searchType={searchType}
        moveInDate={moveInDate}
        moveOutDate={moveOutDate}
        gender={gender}
        input={input}
        setInput={setInput}
        setSearchType={setSearchType}
        setLowPrice={setLowPrice}
        setHighPrice={setHighPrice}
        setMoveInDate={setMoveInDate}
        setMoveOutDate={setMoveOutDate}
        setGender={setGender}
      />
      <Posts
        ref={postsContainer}
        posts={filteredPosts}
        filterBarHeight={filterBarHeight}
        searchBarPosts={searchBarPosts}
        loadingMorePosts={loadingMorePosts}
        scrolledToLastPage={scrolledToLastPage}
      />
    </div>
  );
}
