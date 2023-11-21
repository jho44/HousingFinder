import type { Post, SearchResult } from "@/types";
import { search } from "fast-fuzzy";
import dayjs, { type Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isBetween from "dayjs/plugin/isBetween";
dayjs.extend(isBetween);
dayjs.extend(customParseFormat);

export function postsToSearchResults(allPosts: Post[]) {
  const res: SearchResult = {};
  allPosts.forEach((p) => {
    res[p.id] = {};
  });
  return res;
}

export function getSearchResults(input: string, postsToSearch: Post[]) {
  const searchResults = search(input, postsToSearch, {
    keySelector: (obj) => obj.msg,
    threshold: 0.8,
    returnMatchData: true,
  });
  const newSearchPostResults: SearchResult = {};
  searchResults.forEach(({ item, match }) => {
    newSearchPostResults[item.id] = {
      start: match.index,
      end: match.index + match.length,
    };
  });
  return newSearchPostResults;
}

export function trimWhitespaceOnAllLines(str: string) {
  return str
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();
}

export function convertToDate(dateStr: string, start: boolean) {
  const M_D_YYYY = dayjs(dateStr, "M/D/YYYY", true);
  if (M_D_YYYY.isValid()) {
    return M_D_YYYY;
  }

  const M_D_YY = dayjs(dateStr, "M/D/YY", true);
  if (M_D_YY.isValid()) {
    return M_D_YY;
  }

  const M_YYYY = dayjs(dateStr, "M/YYYY", true);
  if (M_YYYY.isValid()) {
    return start ? M_YYYY.startOf("month") : M_YYYY.endOf("month");
  }

  const M_YY = dayjs(dateStr, "M/YY", true);
  if (M_YY.isValid()) {
    return start ? M_YY.startOf("month") : M_YY.endOf("month");
  }

  return null;
}

export function isWithinXDays(
  userDate: Dayjs,
  postDate: Dayjs,
  numDays: number,
) {
  const userStart = userDate.subtract(numDays, "day");
  const userEnd = userDate.add(numDays, "day");
  return postDate.isBetween(userStart, userEnd, "day", "[]");
}
