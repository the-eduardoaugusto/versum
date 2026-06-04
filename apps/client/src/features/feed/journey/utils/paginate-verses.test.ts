import { describe, expect, it } from "vitest";
import type { VerseData } from "../types";
import { paginateVerses } from "./paginate-verses";

function makeVerses(count: number): VerseData[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `v${i + 1}`,
    number: i + 1,
    text: `Verse ${i + 1}`,
  }));
}

describe("paginateVerses", () => {
  it("returns empty array for empty verses", () => {
    expect(paginateVerses([], 3)).toEqual([]);
  });

  it("returns empty array for versesPerPage < 1", () => {
    expect(paginateVerses(makeVerses(5), 0)).toEqual([]);
  });

  it("returns single page for 2 verses", () => {
    const verses = makeVerses(2);
    const pages = paginateVerses(verses, 3);
    expect(pages).toHaveLength(1);
    expect(pages[0].startVerse).toBe(1);
    expect(pages[0].endVerse).toBe(2);
    expect(pages[0].verses).toHaveLength(2);
  });

  it("splits 7 verses into 3 pages with 3 vpp", () => {
    const verses = makeVerses(7);
    const pages = paginateVerses(verses, 3);
    expect(pages).toHaveLength(3);
    expect(pages[0]).toMatchObject({ startVerse: 1, endVerse: 3 });
    expect(pages[1]).toMatchObject({ startVerse: 4, endVerse: 6 });
    expect(pages[2]).toMatchObject({ startVerse: 7, endVerse: 7 });
  });

  it("splits 176 verses into 9 pages with 20 vpp (last has 16)", () => {
    const verses = makeVerses(176);
    const pages = paginateVerses(verses, 20);
    expect(pages).toHaveLength(9);
    for (let i = 0; i < 8; i++) {
      expect(pages[i].verses).toHaveLength(20);
    }
    expect(pages[8].verses).toHaveLength(16);
    expect(pages[8]).toMatchObject({ startVerse: 161, endVerse: 176 });
  });

  it("handles versesPerPage larger than total verses", () => {
    const verses = makeVerses(3);
    const pages = paginateVerses(verses, 10);
    expect(pages).toHaveLength(1);
    expect(pages[0].verses).toHaveLength(3);
  });
});
