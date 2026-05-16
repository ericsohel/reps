import type { Module } from "../types";

// Stealth prereqs (not enforced by the DAG):
// - Heap-with-staleness discipline. Module 16 teaches heap for top-K
//   and merge-K, not lazy decrease-key. Dijkstra pushes duplicate
//   entries as distances improve; on pop, discard any entry whose
//   stored distance exceeds the current best. Without this check
//   Dijkstra runs but produces subtly wrong distances.

export const shortestPaths: Module = {
  id: "shortest-paths",
  num: 23,
  name: "Shortest Paths",
  section: "2c",
  tier: "core",
  order: 23,
  prereqIds: ["graph-traversal", "heap"],
  isNew: true,
  resources: [
    { title: "USACO Guide — Shortest Paths (Gold)", url: "https://usaco.guide/gold/shortest-paths" },
    { title: "CP-Algorithms — Dijkstra's Algorithm", url: "https://cp-algorithms.com/graph/dijkstra.html" },
    { title: "CP-Algorithms — Bellman-Ford", url: "https://cp-algorithms.com/graph/bellman_ford.html" },
    { title: "CPH Book Ch. 13 — Shortest Paths", url: "https://cses.fi/book/book.pdf" },
  ],
  problems: [
    {
      num: 1,
      title: "Network Delay Time",
      url: "https://leetcode.com/problems/network-delay-time/",
      source: "LC 743",
      difficulty: "medium",
      list: "NC150",
      role: "baseline",
      teaches: "Dijkstra with heap — your Step 1 problem; final answer is `max(dist)`",
    },
    {
      num: 2,
      title: "Flight Discount",
      url: "https://cses.fi/problemset/task/1195",
      source: "CSES",
      difficulty: "easy",
      list: "UG",
      role: "extension",
      teaches: "Dijkstra with **state augmentation** — track `(node, discount_used)`; relax with or without using the discount",
    },
    {
      num: 3,
      title: "High Score",
      url: "https://cses.fi/problemset/task/1673",
      source: "CSES",
      difficulty: "easy",
      list: "UG",
      role: "extension",
      teaches: "Bellman-Ford — handles negative weights; mark nodes affected by negative cycles via a second-pass",
    },
    {
      num: 4,
      title: "Cheapest Flights Within K Stops",
      url: "https://leetcode.com/problems/cheapest-flights-within-k-stops/",
      source: "LC 787",
      difficulty: "medium",
      list: "NC150",
      role: "extension",
      teaches: "Bellman-Ford with **edge-count limit** — run K + 1 waves instead of V − 1; or state-augmented Dijkstra",
    },
    {
      num: 5,
      title: "Find the City With the Smallest Number of Neighbors at a Threshold Distance",
      url: "https://leetcode.com/problems/find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance/",
      source: "LC 1334",
      difficulty: "medium",
      list: "new",
      role: "extension",
      teaches: "Floyd-Warshall on a small graph — `dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j])` with `k` as the outer loop (the intermediate-vertex insight). After O(V³) preprocessing, count neighbors within threshold per city. Classic FAANG application of all-pairs shortest paths; appears in Google interviews.",
    },
    {
      num: 6,
      title: "Minimum Obstacles to Remove to Reach Corner of Grid",
      url: "https://leetcode.com/problems/minimum-obstacle-removal-to-reach-corner-of-grid/",
      source: "LC 2290",
      difficulty: "hard",
      list: "new",
      role: "extension",
      teaches: "0-1 BFS — when edge weights are only 0 or 1, replace the heap with a deque: push to front for 0-weight edges, push to back for 1-weight edges. O(V+E) instead of O(E log V). The natural bridge between BFS and Dijkstra",
    },
    {
      num: 7,
      title: "Swim in Rising Water",
      url: "https://leetcode.com/problems/swim-in-rising-water/",
      source: "LC 778",
      difficulty: "hard",
      list: "NC150",
      role: "checkpoint",
      teaches: "Before reading: the path \"cost\" is the maximum cell elevation, not the sum. Does Dijkstra still apply, and what changes? Yes — the greedy invariant holds for any monotone path statistic. Minimax relaxation: replace `dist[u] + w` with `max(dist[u], cell)` in the priority queue update.",
    },
  ],
};
