import {
  callsToActionFor,
  statsFor,
  type HeroCallsToAction,
  type HeroStat,
} from "./lib/hero";

export type { HeroStat } from "./lib/hero";

/**
 * The route only lays the hero out; what it says lives here so the copy is
 * tested without rendering the page.
 */
export function landingHero(input: {
  signedIn: boolean;
  totalCourses: number;
  totalCategories: number;
}): { callsToAction: HeroCallsToAction; stats: HeroStat[] } {
  return {
    callsToAction: callsToActionFor(input.signedIn),
    stats: statsFor(input),
  };
}
