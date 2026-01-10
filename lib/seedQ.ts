// lib/seedQ.ts
export type SeedOption = {
  id: "A" | "B" | "C" | "D";
  label: string;
  reasons: string[];
};

export type SeedQ = {
  id: string;
  title: string;
  context: string;
  options: SeedOption[];
};

export const seedQ: SeedQ = {
  id: "seed-001",
  title: "What’s the smartest way to learn a new skill?",
  context:
    "I want to add a new skill this year and I’m deciding how to approach it so I actually follow through.",
  options: [
    {
      id: "A",
      label: "Take a structured online course",
      reasons: [
        "Structure helps me stay consistent when motivation dips. Having a clear path reduces friction for me.",
        "I like knowing what “complete” looks like. Courses give me a sense of progress, not just effort.",
        "If I’m new to something, I prefer a framework before experimenting on my own.",
      ],
    },
    {
      id: "B",
      label: "Learn by doing small projects",
      reasons: [
        "I tend to learn best when I’m applying things immediately, even if it’s messy at first.",
        "Small projects reveal what I actually don’t understand faster than lessons do.",
        "Momentum matters to me more than mastery early on.",
      ],
    },
    {
      id: "C",
      label: "Find a mentor or community",
      reasons: [
        "Learning feels easier when I can see how others approach the same problems.",
        "Having people to ask questions of keeps me from getting stuck for too long.",
        "I value shared experience more than perfect information.",
        ],
    },
    {
      id: "D",
      label: "Sample a few approaches first",
      reasons: [
        "I don’t always know how I learn best until I try a few paths.",
        "Sampling helps me avoid committing too early to something that doesn’t fit my style.",
        "I like gathering perspective before settling into a method.",
      ],
    },
  ],
};
