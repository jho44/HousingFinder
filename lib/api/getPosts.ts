import type { Gender, MoveDate, PostTypeFilter } from "@/types.ts";
import { sfCollection2 } from "./mongo.ts";
import { PAGE_SIZE } from "@/lib/constants";
import { convertToDate, isWithinXDays } from "../utils.ts";
import { search } from "fast-fuzzy";
import { FUZZY_SEARCH_OPTS } from "../constants";

/*
plan: start from pageNum
iterate through with cursor till we've reached the end or found PAGE_SIZE
number of results which fit the filter
INCLUDE posts along the way which don't fit the filter
getPosts should also return the last page num that was returned
*/
export default async function getPosts({
  pageNum,
  searchType = "all",
  lowPrice = "",
  highPrice = "",
  moveInDate = null,
  moveOutDate = null,
  gender = null,
  keyword = "",
}: {
  pageNum: number;
  searchType?: PostTypeFilter;
  lowPrice?: string;
  highPrice?: string;
  moveInDate?: MoveDate;
  moveOutDate?: MoveDate;
  gender?: Gender;
  keyword?: string;
}) {
  const query = sfCollection2
    .find({})
    .sort({ created_at: -1, _id: -1 })
    .skip(pageNum * PAGE_SIZE)
    .project({
      _id: 0,
    });

  const results = [];
  let numMatches = 0;
  let numResults = 0;
  for await (const doc of query) {
    const searchTypeCond =
      searchType === "all" ||
      (doc.post_type === "searching_for_lease" &&
        searchType === "searching_for") ||
      (doc.post_type === "offering_lease" && searchType === "offering");

    const lowPriceNum = lowPrice ? parseInt(lowPrice, 10) : 0;
    const lowPriceCond =
      !lowPriceNum || lowPriceNum <= (doc.price_range?.low ?? Infinity);

    const highPriceNum = highPrice ? parseInt(highPrice, 10) : Infinity;
    const highPriceCond =
      !highPriceNum || (doc.price_range?.high ?? 0) <= highPriceNum;

    let moveInDateCond;
    if (!moveInDate || !doc.duration?.start) moveInDateCond = true;
    else {
      const postMoveInDate = convertToDate(doc.duration?.start, true);
      if (postMoveInDate && !isWithinXDays(moveInDate, postMoveInDate, 1))
        moveInDateCond = true;
      else moveInDateCond = false;
    }

    let moveOutDateCond;
    if (!moveOutDate || !doc.duration?.end) moveOutDateCond = true;
    else {
      const postMoveOutDate = convertToDate(doc.duration?.end, true);
      if (postMoveOutDate && !isWithinXDays(moveOutDate, postMoveOutDate, 1))
        moveOutDateCond = true;
      else moveOutDateCond = false;
    }

    const genderCond =
      !gender || !doc.desired_gender || gender === doc.desired_gender;

    const keywordCond =
      !keyword ||
      search(keyword, [doc], {
        ...FUZZY_SEARCH_OPTS,
        keySelector: (obj) => obj.msg,
      }).length;

    if (
      searchTypeCond &&
      lowPriceCond &&
      highPriceCond &&
      moveInDateCond &&
      moveOutDateCond &&
      genderCond &&
      keywordCond
    )
      numMatches++;

    results.push(doc);
    numResults++;

    if (numMatches === PAGE_SIZE && numResults % PAGE_SIZE === 0) break;
  }

  return {
    results,
    lastPageNum: pageNum + numResults / PAGE_SIZE,
  };
}
