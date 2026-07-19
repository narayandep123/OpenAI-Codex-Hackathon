"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowDownUp, SlidersHorizontal, X } from "lucide-react";
import HospitalImage from "@/components/hospital/hospital-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import SurgeryCombobox from "@/components/ui/surgery-combobox";
import type { SearchFilters, SearchResult } from "@/lib/types";

interface SearchResponse {
  filters: SearchFilters;
  total: number;
  results: SearchResult[];
}

type SortOption = "recommended" | "price-low" | "price-high" | "rating";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const createStars = (rating: number) => {
  const fullStars = Math.round(rating);
  return "★".repeat(fullStars) + "☆".repeat(5 - fullStars);
};

export default function SearchClient() {
  const searchParams = useSearchParams();

  const [surgery, setSurgery] = useState(searchParams.get("surgery") ?? "");
  const [city, setCity] = useState(searchParams.get("city") ?? "");
  const [type, setType] = useState(searchParams.get("type") ?? "");
  const [minRating, setMinRating] = useState(Number(searchParams.get("minRating") ?? 1));
  const [minPrice, setMinPrice] = useState(Number(searchParams.get("minPrice") ?? 20000));
  const [maxPrice, setMaxPrice] = useState(Number(searchParams.get("maxPrice") ?? 600000));

  const [filters, setFilters] = useState<SearchFilters | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("recommended");

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    if (surgery) {
      params.set("surgery", surgery);
    }

    if (city) {
      params.set("city", city);
    }

    if (type) {
      params.set("type", type);
    }

    if (minRating > 1) {
      params.set("minRating", String(minRating));
    }

    params.set("minPrice", String(minPrice));
    params.set("maxPrice", String(maxPrice));

    return params.toString();
  }, [city, maxPrice, minPrice, minRating, surgery, type]);

  useEffect(() => {
    const fetchResults = async () => {
      setIsLoading(true);

      try {
        const response = await fetch(`/api/search?${queryString}`);
        const payload = (await response.json()) as SearchResponse;

        setFilters(payload.filters);
        setResults(payload.results);

        if (!searchParams.get("minPrice") && payload.filters.minAvailablePrice > minPrice) {
          setMinPrice(payload.filters.minAvailablePrice);
        }

        if (!searchParams.get("maxPrice") && payload.filters.maxAvailablePrice < maxPrice) {
          setMaxPrice(payload.filters.maxAvailablePrice);
        }
      } finally {
        setIsLoading(false);
      }
    };

    void fetchResults();
  }, [queryString, searchParams, minPrice, maxPrice]);

  const minBound = filters?.minAvailablePrice ?? 20000;
  const maxBound = filters?.maxAvailablePrice ?? 600000;

  const sortedResults = useMemo(() => {
    const nextResults = [...results];

    if (sortBy === "price-low") {
      return nextResults.sort((a, b) => a.minPrice - b.minPrice);
    }

    if (sortBy === "price-high") {
      return nextResults.sort((a, b) => b.maxPrice - a.maxPrice);
    }

    if (sortBy === "rating") {
      return nextResults.sort((a, b) => b.rating - a.rating || a.minPrice - b.minPrice);
    }

    return nextResults;
  }, [results, sortBy]);

  const activeFilters = [
    surgery ? { label: surgery, onRemove: () => setSurgery("") } : null,
    city ? { label: city, onRemove: () => setCity("") } : null,
    type ? { label: type === "multi-specialty" ? "Multi-specialty" : "Standard" , onRemove: () => setType("") } : null,
    minRating > 1 ? { label: `${minRating.toFixed(1)}★ minimum`, onRemove: () => setMinRating(1) } : null,
    minPrice > minBound ? { label: `From ${formatCurrency(minPrice)}`, onRemove: () => setMinPrice(minBound) } : null,
    maxPrice < maxBound ? { label: `Up to ${formatCurrency(maxPrice)}`, onRemove: () => setMaxPrice(maxBound) } : null,
  ].filter((filter): filter is { label: string; onRemove: () => void } => filter !== null);

  const setSafeMinPrice = (value: number) => {
    const nextValue = Math.min(value, maxPrice);
    setMinPrice(nextValue);
  };

  const setSafeMaxPrice = (value: number) => {
    const nextValue = Math.max(value, minPrice);
    setMaxPrice(nextValue);
  };

  const clearFilters = () => {
    setSurgery("");
    setCity("");
    setType("");
    setMinRating(1);
    setMinPrice(minBound);
    setMaxPrice(maxBound);
  };

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-8">
      <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-lg backdrop-blur sm:p-8">
        <h1 className="text-3xl font-semibold text-slate-900">Find Your Best Surgery Match</h1>
        <p className="mt-2 text-slate-600">
          Compare hospitals by price, rating, city, and facility type. Filters update results instantly using
          server-side search.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Surgery Type
            <SurgeryCombobox
              surgeries={filters?.surgeries ?? []}
              value={surgery}
              onValueChange={setSurgery}
              placeholder="All surgeries"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            City
            <select
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
              value={city}
              onChange={(event) => setCity(event.target.value)}
            >
              <option value="">All cities</option>
              {filters?.cities.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Hospital Type
            <select
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
              value={type}
              onChange={(event) => setType(event.target.value)}
            >
              <option value="">All types</option>
              <option value="multi-specialty">Multi-specialty</option>
              <option value="standard">Standard</option>
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Minimum Rating: {minRating.toFixed(1)}
            <input
              type="range"
              min={1}
              max={5}
              step={0.1}
              value={minRating}
              onChange={(event) => setMinRating(Number(event.target.value))}
            />
          </label>

          <div className="flex items-end">
            <div className="flex w-full gap-2">
              <Link href="/chat" className="w-full">
                <Button className="w-full">Ask SurgiFind AI</Button>
              </Link>
              <Link href="/insurance" className="w-full">
                <Button variant="outline" className="w-full">Insurance</Button>
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Tip: the strongest matches are ranked first by rating, then by estimated price.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Minimum Price: {formatCurrency(minPrice)}
            <input
              type="range"
              min={minBound}
              max={maxBound}
              step={5000}
              value={minPrice}
              onChange={(event) => setSafeMinPrice(Number(event.target.value))}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Maximum Price: {formatCurrency(maxPrice)}
            <input
              type="range"
              min={minBound}
              max={maxBound}
              step={5000}
              value={maxPrice}
              onChange={(event) => setSafeMaxPrice(Number(event.target.value))}
            />
          </label>
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-700">
            {isLoading ? "Loading hospitals..." : `Showing ${sortedResults.length} matched hospitals`}
          </p>
          {activeFilters.length > 0 ? (
            <div className="mt-2 flex flex-wrap items-center gap-2" aria-label="Active search filters">
              <SlidersHorizontal className="h-4 w-4 text-slate-500" aria-hidden="true" />
              {activeFilters.map((filter) => (
                <button key={filter.label} type="button" onClick={filter.onRemove} className="inline-flex items-center gap-1 rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-900 transition hover:bg-cyan-100">
                  {filter.label} <X className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="sr-only">Remove {filter.label} filter</span>
                </button>
              ))}
              <button type="button" onClick={clearFilters} className="text-xs font-semibold text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline">Clear all</button>
            </div>
          ) : null}
        </div>

        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <ArrowDownUp className="h-4 w-4 text-teal-600" aria-hidden="true" />
          Sort
          <select className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm" value={sortBy} onChange={(event) => setSortBy(event.target.value as SortOption)}>
            <option value="recommended">Recommended</option>
            <option value="rating">Rating: High to Low</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </label>
      </section>

      {isLoading ? (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={`loading-${index}`} className="overflow-hidden rounded-[2rem]">
              <Skeleton className="h-44 w-full rounded-none" />
              <CardContent className="space-y-3 py-5">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </section>
      ) : null}

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {!isLoading && sortedResults.map((hospital) => (
          <Card
            key={hospital.id}
            className="overflow-hidden rounded-[2rem] transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <HospitalImage
              className="h-44 w-full object-cover"
              imageUrl={hospital.image}
              seed={hospital.id}
              alt={hospital.name}
            />
            <CardContent className="space-y-3 py-5">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-lg font-semibold text-slate-900">{hospital.name}</h2>
                <Badge variant="secondary">
                  {hospital.type}
                </Badge>
              </div>
              <p className="text-sm text-slate-600">{hospital.city}</p>
              <p className="text-sm font-medium text-amber-700">
                {createStars(hospital.rating)} <span className="text-slate-700">{hospital.rating.toFixed(1)}</span>
              </p>
              <div className="rounded-xl bg-slate-100 p-3 text-sm text-slate-700">
                <p className="font-semibold">{hospital.surgeryName}</p>
                <p>
                  {formatCurrency(hospital.minPrice)} - {formatCurrency(hospital.maxPrice)}
                </p>
              </div>
              <Link
                href={`/hospital/${hospital.id}`}
                className="block"
              >
                <Button variant="outline" className="w-full">View Details</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </section>

      {!isLoading && sortedResults.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
          <p className="font-semibold text-slate-800">No hospitals match these filters yet.</p>
          <p className="mt-2 text-sm">Try a broader price range, another city, or a lower minimum rating.</p>
          {activeFilters.length > 0 ? <Button type="button" variant="outline" onClick={clearFilters} className="mt-4">Clear all filters</Button> : null}
        </section>
      ) : null}
    </main>
  );
}
