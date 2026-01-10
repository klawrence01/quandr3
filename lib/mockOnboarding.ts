export type Track = "A" | "B" | "C";

export type MockUser = {
  id: string;
  displayName: string;
  resolvedQs: number;
  helpful: number;
};

export type MockResponse = {
  id: string;
  track: Track;
  body: string;
  user: MockUser;
};

export const mockUsers: MockUser[] = [
  {
    id: "u1",
    displayName: "Jordan M.",
    resolvedQs: 14,
    helpful: 38,
  },
  {
    id: "u2",
    displayName: "Alex R.",
    resolvedQs: 9,
    helpful: 21,
  },
  {
    id: "u3",
    displayName: "Dana L.",
    resolvedQs: 12,
    helpful: 29,
  },
];

export const mockResponses: MockResponse[] = [
  {
    id: "r1",
    track: "B",
    body:
      "I learn fastest when I’m forced to make decisions before I fully understand them. Small projects expose gaps quickly and keep me moving.",
    user: mockUsers[0],
  },
  {
    id: "r2",
    track: "A",
    body:
      "Structure removes decision fatigue for me. When the path is clear, I’m more consistent even when motivation dips.",
    user: mockUsers[1],
  },
  {
    id: "r3",
    track: "C",
    body:
      "I learn best by watching how other people reason through problems. Perspective matters more to me than answers.",
    user: mockUsers[2],
  },
];
