import {
  callsToActionFor,
  statsFor,
  type HeroCallsToAction,
  type HeroStat,
} from "./lib/hero";

export type { HeroCallsToAction, HeroLink, HeroStat } from "./lib/hero";

/**
 * What the landing page hero says: its two calls to action and the stats
 * row beneath them. The route only lays these out.
 */
export function landingHero(input: {
  signedIn: boolean;
  totalCourses: number;
  totalCategories: number;
}): { callsToAction: HeroCallsToAction; stats: HeroStat[] } {
  return {
    callsToAction: callsToActionFor(input.signedIn),
    stats: statsFor({
      courses: input.totalCourses,
      categories: input.totalCategories,
    }),
  };
}
