import {
  Dispatch,
  SetStateAction,
  useState,
  useEffect,
  useRef,
  forwardRef,
  ForwardedRef,
  Fragment,
  type MutableRefObject,
} from "react";
import Image from "next/image";
import dayjs from "dayjs";
import { getSearchResults, postsToSearchResults } from "@/lib/utils";
import Dropdown from "../Dropdowns/Dropdown";
import TypeDropdownPane from "../Dropdowns/TypeDropdownPane";
import { useDebounce } from "../../hooks/useDebounce";
import styles from "./FilterBar.module.css";
import type {
  MoveDate,
  Gender,
  Post,
  SearchResult,
  PostTypeFilter,
} from "../../types";

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
const FilterBar = forwardRef(function FilterBar(
  {
    allPosts,
    posts,
    lowPrice,
    highPrice,
    searchType,
    moveInDate,
    moveOutDate,
    gender,
    debouncedInputRef,
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
    debouncedInputRef: MutableRefObject<string>;
    setPosts: Dispatch<SetStateAction<SearchResult>>;
    setSearchType: Dispatch<SetStateAction<PostTypeFilter>>;
    setLowPrice: Dispatch<SetStateAction<string>>;
    setHighPrice: Dispatch<SetStateAction<string>>;
    setMoveInDate: Dispatch<SetStateAction<MoveDate>>;
    setMoveOutDate: Dispatch<SetStateAction<MoveDate>>;
    setGender: Dispatch<SetStateAction<Gender>>;
  },
  ref: ForwardedRef<HTMLDivElement>,
) {
  const [input, setInput] = useState("");
  const debouncedInput = useDebounce(input, 1000);
  const updatedPosts = useRef(true);

  const [searchTypeOpen, setSearchTypeOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const [moveInOpen, setMoveInOpen] = useState(false);
  const [moveOutOpen, setMoveOutOpen] = useState(false);
  const [genderOpen, setGenderOpen] = useState(false);

  useEffect(() => {
    if (updatedPosts.current) return;
    updatedPosts.current = true;
    debouncedInputRef.current = debouncedInput;
    if (debouncedInput) {
      const newSearchResults = getSearchResults(debouncedInput, posts);
      setPosts(newSearchResults);
    } else setPosts(postsToSearchResults(allPosts));
  }, [debouncedInputRef, debouncedInput, posts, setPosts, allPosts]);

  // TODO: tentatively ready to delete scrollX stuff
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

  const filters = [
    {
      id: "search-type",
      label: "Search Type",
      value: searchType,
      toggleFunc: setSearchTypeOpen,
    },
    {
      id: "low-price",
      label: "Low Price",
      value: lowPrice,
      toggleFunc: setPriceOpen,
      empty: () => setLowPrice(""),
    },
    {
      id: "high-price",
      label: "High Price",
      value: highPrice,
      toggleFunc: setPriceOpen,
      empty: () => setHighPrice(""),
    },
    {
      id: "move-in-date",
      label: "Move-in Date",
      value: moveInDate?.format("MM/DD"),
      toggleFunc: setMoveInOpen,
      empty: () => setMoveInDate(null),
    },
    {
      id: "move-out-date",
      label: "Move-out Date",
      value: moveOutDate?.format("MM/DD"),
      toggleFunc: setMoveOutOpen,
      empty: () => setMoveOutDate(null),
    },
    {
      id: "gender",
      label: "Gender",
      value: gender,
      toggleFunc: setGenderOpen,
      empty: () => setGender(null),
    },
  ];

  return (
    <div
      ref={ref}
      className="z-10 fixed w-screen bg-dark-950 border-b-[1px] border-b-dark-700 flex flex-col py-2.5 px-3 gap-3"
      style={barStyles}
    >
      <div ref={contentEl} className="flex gap-3 flex-wrap">
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
        <Dropdown open={priceOpen} setOpen={setPriceOpen} defaultLabel="price">
          <div
            className={`${styles["dropdown-price"]} shadow-lg shadow-dark-700 flex gap-1 items-center w-[320px] p-2 bg-dark-950`}
          >
            <fieldset className="m-0 flex-1">
              <label htmlFor="min-input" className="screenReaderOnly">
                minimum Rent Input
              </label>
              <input
                className="bg-dark-700 text-dark-200 outline-none border-2 border-dark-700 focus:border-dark-600 shadow shadow-dark-600 w-full p-2 h-[40px] rounded-lg"
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
                className="bg-dark-700 text-dark-200 outline-none border-2 border-dark-700 focus:border-dark-600 shadow shadow-dark-600 w-full p-2 h-[40px] rounded-lg"
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
        <Dropdown
          open={searchTypeOpen}
          setOpen={setSearchTypeOpen}
          defaultLabel="type"
        >
          <div className="gap-2 shadow-[0_0_3px_0_white] shadow-dark-700 flex flex-col w-[222px] bg-dark-950 p-2">
            <TypeDropdownPane
              types={searchTypeLabels}
              setType={setSearchType as Dispatch<SetStateAction<string>>}
              currType={searchType}
            />
          </div>
        </Dropdown>
        <Dropdown
          open={moveInOpen}
          setOpen={setMoveInOpen}
          defaultLabel="move-in date"
        >
          <div className="dropdown-date shadow-[0_0_3px_0_white] shadow-dark-700">
            <Calendar
              value={moveInDate?.toDate()}
              onChange={(e) => setMoveInDate(dayjs(e.value) ?? dayjs())}
              minDate={new Date()}
              inline
            />
          </div>
        </Dropdown>
        <Dropdown
          open={moveOutOpen}
          setOpen={setMoveOutOpen}
          defaultLabel="move-out date"
        >
          <div className="dropdown-date shadow-[0_0_3px_0_white] shadow-dark-700">
            <Calendar
              value={moveOutDate?.toDate()}
              onChange={(e) => setMoveOutDate(dayjs(e.value) ?? dayjs())}
              minDate={new Date()}
              inline
            />
          </div>
        </Dropdown>
        <Dropdown
          open={genderOpen}
          setOpen={setGenderOpen}
          defaultLabel="gender"
        >
          <div className="gap-2 shadow-[0_0_3px_0_white] shadow-dark-700 flex flex-col w-[222px] bg-dark-950 p-2">
            <TypeDropdownPane
              types={genderLabels}
              setType={setGender as Dispatch<SetStateAction<string>>}
              currType={gender}
            />
          </div>
        </Dropdown>
      </div>
      <div className="flex gap-2 flex-wrap">
        <label className="text-dark-300">Filters:</label>
        {filters.map((f) =>
          f.value ? (
            <div
              id={`${f.id}-filter-btn`}
              key={f.id}
              className="group whitespace-nowrap flex items-center gap-2 cursor-pointer rounded-lg bg-bright-400 hover:bg-bright-300 items-center py-1.5 px-3 text-dark-950 hover:text-bright-950"
              onClick={() => f.toggleFunc((o) => !o)}
            >
              {f.label}: {f.value}
              {f.id === "search-type" ? (
                <></>
              ) : (
                <div
                  className="flex justify-center items-center w-3.5 h-3.5 rounded-full bg-dark-950 group-hover:bg-bright-950"
                  onClick={f.empty}
                >
                  <Image
                    src="/icons/close.svg"
                    height={6}
                    width={6}
                    alt="Remove filter"
                    className="min-w-[4px]"
                  />
                </div>
              )}
            </div>
          ) : (
            <Fragment key={f.id} />
          ),
        )}
      </div>
    </div>
  );
});

export default FilterBar;
