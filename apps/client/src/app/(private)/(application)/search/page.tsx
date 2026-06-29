"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { SplitText } from "gsap/all";
import { useRef } from "react";
import { SearchInput } from "@/features/search/components/search-input";

const SEARCH_INPUT_PLACEHOLDERS: string[] = [
  "Gn 1:10-13",
  "Gênesis 1:10-13",
  "Gênesis",
  "Gênesis 1",
];

export default function SearchPage() {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const randomPlaceholder =
    SEARCH_INPUT_PLACEHOLDERS[
      Math.floor(Math.random() * SEARCH_INPUT_PLACEHOLDERS.length)
    ];

  useGSAP(
    () => {
      if (!titleRef.current || !inputRef.current) return;
      const splitedTitle = new SplitText(titleRef.current, { type: "words" });
      if (titleRef.current.style.visibility !== "visible")
        titleRef.current.style.visibility = "visible";
      gsap.fromTo(
        splitedTitle.words,
        { opacity: 0, y: 50, filter: "blur(10px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          ease: "power3.out",
          stagger: 0.14,
        },
      );
      if (inputRef.current.style.visibility !== "visible")
        inputRef.current.style.visibility = "visible";
      gsap.fromTo(
        inputRef.current,
        { opacity: 0, y: 50, filter: "blur(10px)" },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          filter: "blur(0px)",
          ease: "power3.out",
          delay: 0.5,
        },
      );
    },
    { scope: titleRef },
  );

  return (
    <div className="flex items-center justify-center h-svh w-full">
      <div className="w-8/10 max-w-[500px] space-y-4 place-items-center">
        <h1
          ref={titleRef}
          className="font-instrument-serif text-4xl md:text-6xl overflow-hidden invisible md:leading-16"
        >
          O que deseja buscar?
        </h1>
        <SearchInput ref={inputRef} placeholder={randomPlaceholder} />
      </div>
    </div>
  );
}
