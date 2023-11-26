import type { Gender, PostTypeFilter } from "@/lib/types.ts";
import { sfCollection2 } from "./mongo.ts";
import { PAGE_SIZE } from "@/lib/constants";
import { search } from "fast-fuzzy";
import { FUZZY_SEARCH_OPTS } from "../constants";
import {
  satisfiesGender,
  satisfiesHighPrice,
  satisfiesLowPrice,
  satisfiesMoveInDate,
  satisfiesMoveOutDate,
  satisfiesSearchType,
} from "@/lib/utils/filter";
import dayjs from "dayjs";

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
  moveInDate?: string | null;
  moveOutDate?: string | null;
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
  for await (const doc of query) {
    const searchTypeCond = satisfiesSearchType(searchType, doc.post_type);

    const lowPriceCond = satisfiesLowPrice(
      lowPrice,
      doc.price_range?.low,
      doc.price_range?.high,
    );

    const highPriceCond = satisfiesHighPrice(
      highPrice,
      doc.price_range?.low,
      doc.price_range?.high,
    );

    const moveInDateCond = satisfiesMoveInDate(
      moveInDate ? dayjs(moveInDate) : null,
      doc.duration?.start,
    );

    const moveOutDateCond = satisfiesMoveOutDate(
      moveOutDate ? dayjs(moveOutDate) : null,
      doc.duration?.end,
    );

    const genderCond = satisfiesGender(gender, doc.desired_gender);

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
    ) {
      numMatches++;
    }

    results.push(doc);

    if (numMatches >= PAGE_SIZE && results.length % PAGE_SIZE === 0) break;
  }

  await query.close();

  return {
    results,
    nextPageNum: pageNum + results.length / PAGE_SIZE,
  };
}
