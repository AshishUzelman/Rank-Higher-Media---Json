import { Geist } from "next/font/google";

const geist = Geist({
  subsets: ["latin"],
});

export default function Home() {
  return (
    <div className={`${geist.variable} min-h-screen flex flex-col items-center justify-center p-24`}>
      <h1 className="text-4xl font-bold">Welcome to RankHigherMedia</h1>
      <p className="mt-4 text-xl">Your SEO Tool Platform</p>
    </div>
  );
}
