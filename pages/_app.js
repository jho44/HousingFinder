import { Roboto } from "next/font/google";
import "tailwindcss/tailwind.css";
import "../globals.css";

const roboto = Roboto({
  weight: ["400", "700"],
  subsets: ["latin"],
});

export default function MyApp({ Component, pageProps }) {
  return (
    <main
      className={`${roboto.className} overflow-y-hidden h-screen bg-dark-950 text-dark-100`}
    >
      <Component {...pageProps} />
    </main>
  );
}
