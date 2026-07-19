import { Suspense } from "react";
import SearchClient from "./search-client";

export default function SearchPage() {
  return (
    <Suspense fallback={<main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8">Loading search...</main>}>
      <SearchClient />
    </Suspense>
  );
}
