import type { Gender, MoveDate, PostType, PostTypeFilter } from "@/lib/types";
import { convertToDate, isWithinXDays } from "./general";

export const satisfiesSearchType = (
  desiredSearchType: PostTypeFilter,
  searchTypeOfPost: PostType,
) =>
  desiredSearchType === "all" ||
  (searchTypeOfPost === "searching_for_lease" &&
    desiredSearchType === "searching_for") ||
  (searchTypeOfPost === "offering_lease" && desiredSearchType === "offering");

export const satisfiesLowPrice = (
  desiredLowPrice: string,
  lowPriceOfPost: number | undefined,
  highPriceOfPost: number | undefined,
) => {
  const lowPriceNum = desiredLowPrice ? parseInt(desiredLowPrice, 10) : 0;
  return (
    !lowPriceNum ||
    (lowPriceNum <= (lowPriceOfPost ?? Infinity) &&
      lowPriceNum <= (highPriceOfPost ?? Infinity))
  );
};

export const satisfiesHighPrice = (
  desiredHighPrice: string,
  lowPriceOfPost: number | undefined,
  highPriceOfPost: number | undefined,
) => {
  const highPriceNum = desiredHighPrice ? parseInt(desiredHighPrice, 10) : 0;
  return (
    !highPriceNum ||
    ((lowPriceOfPost ?? 0) <= highPriceNum &&
      (highPriceOfPost ?? 0) <= highPriceNum)
  );
};

export const satisfiesMoveInDate = (
  desiredMoveInDate: MoveDate,
  moveInDateOfPost: string | undefined,
) => {
  let moveInDateCond;
  if (!desiredMoveInDate || !moveInDateOfPost) moveInDateCond = true;
  else {
    const postMoveInDate = convertToDate(moveInDateOfPost, true);
    if (postMoveInDate && isWithinXDays(desiredMoveInDate, postMoveInDate, 1))
      moveInDateCond = true;
    else moveInDateCond = false;
  }
  return moveInDateCond;
};

export const satisfiesMoveOutDate = (
  desiredMoveOutDate: MoveDate,
  moveOutDateOfPost: string | undefined,
) => {
  let moveOutDateCond;
  if (!desiredMoveOutDate || !moveOutDateOfPost) moveOutDateCond = true;
  else {
    const postMoveOutDate = convertToDate(moveOutDateOfPost, false);
    if (
      postMoveOutDate &&
      isWithinXDays(desiredMoveOutDate, postMoveOutDate, 1)
    )
      moveOutDateCond = true;
    else moveOutDateCond = false;
  }
  return moveOutDateCond;
};

export const satisfiesGender = (
  desiredGender: Gender,
  genderOfPost: Gender | undefined,
) => !desiredGender || !genderOfPost || desiredGender === genderOfPost;
