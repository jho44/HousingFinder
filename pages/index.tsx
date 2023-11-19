import { Barlow_Condensed, Barlow } from "next/font/google";
import Link from "next/link";

const barlowCondensed = Barlow_Condensed({
  weight: ["500"],
  subsets: ["latin"],
});

const barlow = Barlow({
  weight: ["400", "500"],
  subsets: ["latin"],
});

export default function Home() {
  return (
    <div className="flex flex-col items-center py-[15%] sm:py-[10%] px-[5%] h-full overflow-y-scroll gap-[10%]">
      <div className={`${barlowCondensed.className} text-center`}>
        <h1 className="font-medium text-6xl sm:text-8xl mb-[5%] text-dark-100">
          HousingFinder <span className="text-bright-300">accelerates</span> the
          housing hunt
        </h1>
        <ul className="text-center mb-[1%] font-medium text-[40px] sm:text-[44px]">
          <li>
            <h3 className="text-dark-200">leases</h3>
          </li>
          <li>
            <h3 className="text-dark-300">roommates</h3>
          </li>
          <li>
            <h3 className="text-dark-400">tenants</h3>
          </li>
        </ul>
      </div>
      <Link href="/search">
        <button
          className={`${barlowCondensed.className} font-medium text-center text-3xl sm:text-4xl bg-bright-500 hover:bg-bright-600 active:bg-bright-700 py-2.5 px-6 rounded-full mb-[2%] transition-colors`}
        >
          Start Searching
        </button>
      </Link>
      <p
        className={`${barlow.className} leading-normal text-xl sm:text-2xl text-center text-dark-200`}
      >
        Facebook Housing Groups remains a longstanding avenue for connecting
        roomies and lessee to leasors. However, FB Groups aren&apos;t tailored
        for housing searches. Sifting through 100+ posts on any day can be
        overwhelming and frustrating, especially when only some are relevant to
        your needs. FB Groups lack essential search and filtering features, such
        as keyword searches and price range filters, making the housing hunt
        unnecessarily cumbersome. Enter HousingFinder — an innovative solution
        providing the tools you need to streamline your search within the
        Facebook community.
      </p>

      <h2 className="font-medium text-4xl sm:text-5xl text-center leading-snug mt-[10%] mb-[2%]">
        This project is in its{" "}
        <span className="text-bright-300">beta phase</span>
      </h2>
      <p
        className={`${barlow.className} leading-normal text-xl sm:text-2xl text-center text-dark-200`}
      >
        HousingFinder currently only supports the{" "}
        <a
          className="text-bright-600"
          href="https://www.facebook.com/groups/843764532374203"
        >
          San Francisco Housing, Rooms, Apartments, Sublets
        </a>{" "}
        Group. HF also doesn&apos;t automatically get the latest posts in the
        group. If you&apos;d like for HF to support a certain FB group, kindly{" "}
        <a href="mailto:findhousing.ai@gmail.com" className="text-bright-600">
          send us an email
        </a>
        .
      </p>
    </div>
  );
}
