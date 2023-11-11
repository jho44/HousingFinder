import dayjs, { type Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isBetween from "dayjs/plugin/isBetween";
dayjs.extend(isBetween);
dayjs.extend(customParseFormat);

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

  const M_YYYY = dayjs(dateStr, "M/YYYY", true);
  if (M_YYYY.isValid()) {
    return start ? M_YYYY.startOf("month") : M_YYYY.endOf("month");
  }

  return null;
}

export function isWithin16Days(userDate: Dayjs, postDate: Dayjs) {
  const userStart = userDate.subtract(16, "day");
  const userEnd = userDate.add(16, "day");
  return postDate.isBetween(userStart, userEnd, "day", "[]");
}
