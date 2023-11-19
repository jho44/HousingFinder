import Head from "next/head";
import { Roboto } from "next/font/google";
import "tailwindcss/tailwind.css";
import "../globals.css";

const roboto = Roboto({
  weight: ["400", "700"],
  subsets: ["latin"],
});

const title = "LeaseSearch";
const description = "Easily filter and search through FB Housing Group posts";

export default function MyApp({ Component, pageProps }) {
  return (
    <main
      className={`${roboto.className} overflow-y-hidden h-screen bg-dark-950 text-dark-100`}
    >
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />

        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content="/opengraph-image.png" />
      </Head>
      <Component {...pageProps} />
    </main>
  );
}
