import { Dispatch, SetStateAction } from "react";
import Image from 'next/image';

export default function TypeDropdownPane({ types, setType, currType }: {
  types: { id: string; label: string; }[];
  setType: Dispatch<SetStateAction<string>>;
  currType: string | null;
}) {
  return (
    <>
      {
        types.map(({ id, label }) => {
          return (
            <fieldset key={id} className="flex items-center gap-2 cursor-pointer hover:bg-dark-900 rounded py-1 px-2" onClick={() => setType(id)}>
              <div className='flex items-center justify-center h-4 w-4 rounded-[3px] border-[1px] border-dark-200'>
                {
                  currType === id ? <Image
                    src="/icons/checkmark.svg"
                    height="0"
                    width="0"
                    alt={`${label} checkmark`}
                    className="w-3 h-auto"
                  /> : <></>
                }
              </div>
              {label}
            </fieldset>)
        })
      }
    </>
  );
}