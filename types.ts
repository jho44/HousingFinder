import type { Dayjs } from "dayjs";

export type MoveDate = Dayjs | null;

export type Gender = "male" | "female" | null;

export type PostType = "searching_for" | "offering";
export type PostTypeFilter = PostType | "all";

export type Post = {
  id: string;
  msg: string;
  created_at: string;
  author: {
    name: string;
    id: string | null;
    profileImgUrl: string;
  };
  post_type: "searching_for_lease" | "offering_lease";
  duration?: {
    start?: string;
    end?: string;
  };
  price_range?: {
    low?: number;
    high?: number;
  };
  amenities?:
    | "parking"
    | "furnished"
    | "laundry"
    | "AC"
    | "internet"
    | "common areas"
    | "balcony"
    | "patio"
    | "yard"
    | "heating"
    | "smoke free"
    | "cable"
    | "security"
    | "kitchen"
    | "gym"
    | "pool"
    | "pets"[];
  desired_gender?: "male" | "female";
};

export type SearchResult = {
  [key: string]: { start?: number; end?: number };
  // post's ID to start and end indices of search match
};
