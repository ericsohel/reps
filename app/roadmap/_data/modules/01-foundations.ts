import type { Module } from "../types";

export const foundations: Module = {
  id: "foundations",
  num: 1,
  name: "Foundations",
  section: "0",
  track: "both",
  order: 1,
  prereqIds: [],
  resources: [
    { title: "USACO Guide — Time Complexity", url: "https://usaco.guide/bronze/time-comp" },
  ],
  checklist: [
    { num: 1, title: "Time complexity & the Python ops budget" },
    { num: 2, title: "Space complexity" },
    { num: 3, title: "Python stdlib fluency" },
    { num: 4, title: "Sorting with custom keys" },
    { num: 5, title: "I/O" },
    { num: 6, title: "Integer arithmetic and modular ops" },
    { num: 7, title: "Recursion: limits, base cases, memoisation" },
  ],
};
