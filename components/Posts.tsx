import { type ForwardedRef, forwardRef } from "react";
import Image from "next/image";
import dayjs from "dayjs";
import { GRP_ID } from "@/lib/constants";

import Spinner from "../components/Spinner/Spinner";

import type { Post, SearchResult } from "../types";

const Posts = forwardRef(function Posts(
  {
    posts,
    filterBarHeight,
    searchBarPosts,
    loadingMorePosts,
    scrolledToLastPage,
  }: {
    posts: Post[];
    filterBarHeight: number;
    searchBarPosts: SearchResult;
    loadingMorePosts: boolean;
    scrolledToLastPage: boolean;
  },
  ref: ForwardedRef<HTMLDivElement>,
) {
  return (
    <div
      ref={ref}
      className="flex flex-col items-center px-4 pb-4 gap-4"
      style={{ paddingTop: `calc(${filterBarHeight}px + 16px)` }}
    >
      {posts.length ? (
        posts.map((post) => {
          const postId = post.id;
          const ogPostLink = `https://www.facebook.com/groups/${GRP_ID}/posts/${postId}/`;
          return (
            <div
              key={post.id}
              className="flex flex-col gap-3 py-3 px-4 rounded-lg max-w-full break-words w-full sm:max-w-[680px] bg-dark-900"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* {post.author.id ? (
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
                  )} */}
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
        <></>
      )}
      {loadingMorePosts ? (
        <Spinner />
      ) : (
        <p className="text-dark-200 text-lg">
          {scrolledToLastPage ? "No more posts" : "Swipe down for more"}
        </p>
      )}
    </div>
  );
});

export default Posts;
