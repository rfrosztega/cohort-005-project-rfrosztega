export type HeroLink = { to: string; label: string };

export type HeroCallsToAction = { primary: HeroLink; secondary: HeroLink };

export type HeroStat = {
  key: "courses" | "categories" | "pace";
  value: string;
  label: string;
};

export function callsToActionFor(signedIn: boolean): HeroCallsToAction {
  return {
    primary: { to: "/courses", label: "Browse courses" },
    secondary: signedIn
      ? { to: "/dashboard", label: "Go to your dashboard" }
      : { to: "/signup", label: "Create a free account" },
  };
}

function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}

export function statsFor(totals: {
  courses: number;
  categories: number;
}): HeroStat[] {
  return [
    {
      key: "courses",
      value: String(totals.courses),
      label: plural(totals.courses, "Course", "Courses"),
    },
    {
      key: "categories",
      value: String(totals.categories),
      label: plural(totals.categories, "Category", "Categories"),
    },
    { key: "pace", value: "Self-paced", label: "Your schedule" },
  ];
}
