import { Dispatch, SetStateAction, useState, useEffect, useRef } from "react";
import Image from "next/image";
import dayjs from "dayjs";
import { search } from "fast-fuzzy";
import Dropdown from "./Dropdown";
import TypeDropdownPane from "./TypeDropdownPane";
import { useDebounce } from "../hooks/useDebounce";
import styles from "./FilterBar.module.css";
import type { MoveDate, Gender, Post } from "../types";

import { Calendar } from "primereact/calendar";

const searchTypeLabels = [
  {
    id: "searching_for",
    label: "Searching for lease",
  },
  {
    id: "offering",
    label: "Offering lease",
  },
  {
    id: "all",
    label: "Both of the above",
  },
];
const genderLabels = [
  { id: "female", label: "Female" },
  { id: "male", label: "Male" },
];

export default function FilterBar({
  allPosts,
  posts,
  lowPrice,
  highPrice,
  searchType,
  moveInDate,
  moveOutDate,
  gender,
  setPosts,
  setSearchType,
  setLowPrice,
  setHighPrice,
  setMoveInDate,
  setMoveOutDate,
  setGender,
}: {
  allPosts: Post[];
  posts: Post[];
  lowPrice: string;
  highPrice: string;
  searchType: string;
  moveInDate: MoveDate;
  moveOutDate: MoveDate;
  gender: Gender;
  setPosts: Dispatch<SetStateAction<Post[]>>;
  setSearchType: Dispatch<SetStateAction<string>>;
  setLowPrice: Dispatch<SetStateAction<string>>;
  setHighPrice: Dispatch<SetStateAction<string>>;
  setMoveInDate: Dispatch<SetStateAction<MoveDate>>;
  setMoveOutDate: Dispatch<SetStateAction<MoveDate>>;
  setGender: Dispatch<SetStateAction<Gender>>;
}) {
  const [input, setInput] = useState("");
  const debouncedInput = useDebounce(input, 1000);
  const updatedPosts = useRef(true);

  useEffect(() => {
    if (updatedPosts.current) return;
    updatedPosts.current = true;

    if (debouncedInput) {
      setPosts(
        search(debouncedInput, posts, { keySelector: (obj) => obj.msg }),
      );
    } else setPosts(allPosts);
  }, [debouncedInput, posts, setPosts, allPosts]);

  const [scrollX, setScrollX] = useState(0);
  const contentEl = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const currContentEl = contentEl.current;
    if (!currContentEl) return;
    const handleScroll = (e: Event) => {
      if (e.currentTarget instanceof HTMLDivElement) {
        setScrollX(e.currentTarget.scrollLeft);
      }
    };

    currContentEl.addEventListener("scroll", handleScroll);
    return () => currContentEl.removeEventListener("scroll", handleScroll);
  }, []);

  const barStyles = {
    "--scroll-x": `-${scrollX}px`,
  } as React.CSSProperties;

  return (
    <div className="fixed w-screen" style={barStyles}>
      <div
        ref={contentEl}
        className="h-[--bar-height] z-10 flex bg-dark-950 py-2.5 px-3 gap-3 border-b-[1px] border-b-dark-700 overflow-x-scroll hide-scrollbar"
      >
        <Dropdown defaultLabel="price">
          <div
            className={`${styles["dropdown-price"]} shadow-lg shadow-dark-700 flex gap-1 items-center w-[320px] p-2 bg-dark-950`}
          >
            <fieldset className="m-0 flex-1">
              <label htmlFor="min-input" className="screenReaderOnly">
                minimum Rent Input
              </label>
              <input
                className="bg-dark-700 text-dark-200 placeholder:text-dark-400 outline-none border-2 border-dark-700 focus:border-dark-600 shadow shadow-dark-600 w-full p-2 h-[40px] rounded-lg"
                id="min-input"
                maxLength={6}
                type="number"
                autoComplete="off"
                placeholder="Min Rent"
                value={lowPrice}
                onChange={(e) => setLowPrice(e.target.value)}
              />
            </fieldset>
            <div className="min-w-[12px] h-[2px] rounded bg-dark-200" />
            <fieldset className="m-0 flex-1">
              <label htmlFor="max-input" className="screenReaderOnly">
                maximum Rent Input
              </label>
              <input
                className="bg-dark-700 text-dark-200 placeholder:text-dark-400 outline-none border-2 border-dark-700 focus:border-dark-600 shadow shadow-dark-600 w-full p-2 h-[40px] rounded-lg"
                id="max-input"
                maxLength={6}
                type="number"
                autoComplete="off"
                placeholder="Max Rent"
                value={highPrice}
                onChange={(e) => setHighPrice(e.target.value)}
              />
            </fieldset>
          </div>
        </Dropdown>
        <Dropdown defaultLabel="type">
          <div className="gap-2 shadow-[0_0_3px_0_white] shadow-dark-700 flex flex-col w-[222px] bg-dark-950 p-2">
            <TypeDropdownPane
              types={searchTypeLabels}
              setType={setSearchType}
              currType={searchType}
            />
          </div>
        </Dropdown>
        <Dropdown defaultLabel="move-in date">
          <div className="dropdown-date shadow-[0_0_3px_0_white] shadow-dark-700">
            <Calendar
              value={moveInDate?.toDate()}
              onChange={(e) => setMoveInDate(dayjs(e.value) ?? dayjs())}
              minDate={new Date()}
              inline
            />
          </div>
        </Dropdown>
        <Dropdown defaultLabel="move-out date">
          <div className="dropdown-date shadow-[0_0_3px_0_white] shadow-dark-700">
            <Calendar
              value={moveOutDate?.toDate()}
              onChange={(e) => setMoveOutDate(dayjs(e.value) ?? dayjs())}
              minDate={new Date()}
              inline
            />
          </div>
        </Dropdown>
        <Dropdown defaultLabel="gender">
          <div className="gap-2 shadow-[0_0_3px_0_white] shadow-dark-700 flex flex-col w-[222px] bg-dark-950 p-2">
            <TypeDropdownPane
              types={genderLabels}
              setType={setGender as Dispatch<SetStateAction<string>>}
              currType={gender}
            />
          </div>
        </Dropdown>
        <div className="flex items-center gap-2 px-3 rounded-[50px] bg-dark-700 text-dark-200">
          <Image
            src="/icons/magnifying-glass.svg"
            height={20}
            width={20}
            alt="Search bar icon"
          />
          <input
            className="bg-transparent focus:outline-none"
            placeholder="Search by keyword"
            value={input}
            onChange={(e) => {
              updatedPosts.current = false;
              setInput(e.target.value);
            }}
          />
        </div>
      </div>
    </div>
  );
}
