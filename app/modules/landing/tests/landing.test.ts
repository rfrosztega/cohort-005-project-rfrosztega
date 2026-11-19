import { describe, it, expect } from "vitest";
import { landingHero } from "../index";

const totals = { totalCourses: 4, totalCategories: 5 };

describe("landingHero calls to action", () => {
  it("sends everyone to the catalogue first", () => {
    const { callsToAction } = landingHero({ signedIn: false, ...totals });
    expect(callsToAction.primary).toEqual({
      to: "/courses",
      label: "Browse courses",
    });
  });

  it("invites a visitor to sign up", () => {
    const { callsToAction } = landingHero({ signedIn: false, ...totals });
    expect(callsToAction.secondary).toEqual({
      to: "/signup",
      label: "Create a free account",
    });
  });

  it("sends a signed-in learner to their dashboard", () => {
    const { callsToAction } = landingHero({ signedIn: true, ...totals });
    expect(callsToAction.primary.to).toBe("/courses");
    expect(callsToAction.secondary).toEqual({
      to: "/dashboard",
      label: "Go to your dashboard",
    });
  });
});

describe("landingHero stats", () => {
  it("shows the course and category totals, then the pace", () => {
    const { stats } = landingHero({ signedIn: false, ...totals });
    expect(stats).toEqual([
      { key: "courses", value: "4", label: "Courses" },
      { key: "categories", value: "5", label: "Categories" },
      { key: "pace", value: "Self-paced", label: "Your schedule" },
    ]);
  });

  it("uses the singular for a count of one", () => {
    const { stats } = landingHero({
      signedIn: false,
      totalCourses: 1,
      totalCategories: 1,
    });
    expect(stats.map((s) => s.label).slice(0, 2)).toEqual([
      "Course",
      "Category",
    ]);
  });

  it("uses the plural for zero", () => {
    const { stats } = landingHero({
      signedIn: false,
      totalCourses: 0,
      totalCategories: 0,
    });
    expect(stats.slice(0, 2)).toEqual([
      { key: "courses", value: "0", label: "Courses" },
      { key: "categories", value: "0", label: "Categories" },
    ]);
  });
});
