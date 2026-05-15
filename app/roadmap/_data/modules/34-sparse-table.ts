import type { Module } from "../types";

export const sparseTable: Module = {
  id: "sparse-table",
  num: 34,
  name: "Sparse Table",
  section: "2d",
  track: "cp",
  order: 34,
  prereqIds: ["binary-search", "prefix-sums"],
  isNew: true,
  resources: [],
};
