import {
  useState,
  ReactNode,
  useEffect,
  useRef,
  SetStateAction,
  Dispatch,
} from "react";
import Image from "next/image";

export default function Dropdown({
  defaultLabel,
  open,
  setOpen,
  children,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  defaultLabel: string;
  children: ReactNode;
}) {
  const dropdown = useRef<HTMLDivElement>(null);
  const dropdownBtn = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // only add the event listener when the dropdown is opened
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Element;
      if (
        !target ||
        (!dropdown.current?.contains(target) &&
          !dropdownBtn.current?.contains(target) &&
          !target.classList.value.includes("datepicker") &&
          (target.nodeName !== "path" ||
            !target.parentElement?.classList.value.includes("datepicker")) &&
          !target.id.endsWith("-filter-btn"))
      ) {
        setOpen(false);
      }
    }

    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("click", handleClick);
    window.addEventListener("keydown", handleEsc);

    return () => {
      window.removeEventListener("click", handleClick);
      window.removeEventListener("keydown", handleEsc);
    };
  }, [open, setOpen]);

  const [btnBottom, setBtnBottom] = useState(0); // record of the button's bottom as window size changes

  useEffect(() => {
    const updateBtnBottom = () => {
      if (dropdownBtn.current) {
        const bottom = dropdownBtn.current.getBoundingClientRect().bottom;
        setBtnBottom(bottom);
      }
    };

    updateBtnBottom();

    const handleResize = () => {
      updateBtnBottom();
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const posStyle = {
    transform: "translateX(var(--scroll-x))",
    top: `${btnBottom + 10}px`,
  };
  return (
    <div className="relative">
      <div
        ref={dropdownBtn}
        onClick={() => setOpen((o) => !o)}
        className="menu-btn border-[1px] border-dark-700 flex gap-2 cursor-pointer rounded-lg bg-dark-950 hover:bg-dark-850 items-center py-1.5 px-3 text-dark-200"
      >
        <label className="select-none cursor-pointer whitespace-nowrap">
          {defaultLabel}
        </label>
        <Image
          src="/icons/rounded-triangle.svg"
          height={0}
          width={0}
          alt={`${defaultLabel} dropdown`}
          className="w-2 min-w-[8px] h-auto"
        />
      </div>
      {open ? (
        <div id="boop" className="fixed z-10" style={posStyle} ref={dropdown}>
          {open ? children : <></>}
        </div>
      ) : (
        <></>
      )}
    </div>
  );
}
