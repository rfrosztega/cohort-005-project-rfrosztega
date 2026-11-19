import { Link } from "react-router";
import { useState, useEffect } from "react";
import type { Route } from "./+types/home";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "~/components/ui/card";
import { CourseStatus } from "~/db/schema";
import {
  BookOpen,
  GraduationCap,
  Users,
  ArrowRight,
  User,
  Moon,
  Sun,
  Sparkles,
} from "lucide-react";
import { landingHero, type HeroStat } from "~/modules/landing";
import { CourseImage } from "~/components/course-image";
import { DevUI } from "~/components/dev-ui";
import { getCurrentUserId, getDevCountry } from "~/lib/session";
import { getCountryTierInfo, COUNTRIES } from "~/lib/ppp";
import { eq, like, and, or, sql } from "drizzle-orm";
import { db } from "~/db";
import { courses, categories, users, modules, lessons } from "~/db/schema";

function getAllUsers() {
  return db.select().from(users).all();
}

function getUserById(id: number) {
  return db.select().from(users).where(eq(users.id, id)).get();
}

function getAllCategories() {
  return db.select().from(categories).orderBy(categories.name).all();
}

function buildCourseQuery(
  search: string | null,
  category: string | null,
  status: CourseStatus | null,
  sortBy: string | null,
  limit: number,
  offset: number
) {
  const conditions = [];

  if (status) {
    conditions.push(eq(courses.status, status));
  }

  if (search) {
    const term = `%${search}%`;
    conditions.push(
      or(like(courses.title, term), like(courses.description, term))
    );
  }

  const query = db
    .select({
      id: courses.id,
      title: courses.title,
      slug: courses.slug,
      description: courses.description,
      salesCopy: courses.salesCopy,
      instructorId: courses.instructorId,
      categoryId: courses.categoryId,
      status: courses.status,
      coverImageUrl: courses.coverImageUrl,
      price: courses.price,
      pppEnabled: courses.pppEnabled,
      createdAt: courses.createdAt,
      updatedAt: courses.updatedAt,
      instructorName: users.name,
      instructorAvatarUrl: users.avatarUrl,
      categoryName: categories.name,
    })
    .from(courses)
    .innerJoin(users, eq(courses.instructorId, users.id))
    .innerJoin(categories, eq(courses.categoryId, categories.id));

  if (category) {
    conditions.push(eq(categories.slug, category));
  }

  const filtered =
    conditions.length > 0 ? query.where(and(...conditions)) : query;

  const sorted =
    sortBy === "title"
      ? filtered.orderBy(courses.title)
      : sortBy === "oldest"
        ? filtered.orderBy(courses.createdAt)
        : filtered.orderBy(sql`${courses.createdAt} DESC`);

  return sorted.limit(limit).offset(offset).all();
}

function getLessonCountForCourse(courseId: number) {
  const courseModules = db
    .select({ id: modules.id })
    .from(modules)
    .where(eq(modules.courseId, courseId))
    .all();

  if (courseModules.length === 0) return 0;

  const count = db
    .select({ count: sql<number>`count(*)` })
    .from(lessons)
    .where(or(...courseModules.map((m) => eq(lessons.moduleId, m.id))))
    .get();

  return count?.count ?? 0;
}

export function meta() {
  return [
    { title: "Cadence — Learn at your own pace" },
    {
      name: "description",
      content:
        "A modern course platform for developers. Browse courses, track your progress, and learn at your own pace.",
    },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const courses = buildCourseQuery(
    null,
    null,
    CourseStatus.Published,
    "newest",
    50,
    0
  );
  const featured = courses.slice(0, 4).map((course) => ({
    ...course,
    lessonCount: getLessonCountForCourse(course.id),
  }));
  const categories = getAllCategories();
  const users = getAllUsers();
  const currentUserId = await getCurrentUserId(request);
  const currentUser = currentUserId ? getUserById(currentUserId) : null;
  const devCountry = await getDevCountry(request);
  const countryTierInfo = getCountryTierInfo(devCountry);

  return {
    featuredCourses: featured,
    totalCourses: courses.length,
    totalCategories: categories.length,
    users: users.map((u) => ({ id: u.id, name: u.name, role: u.role })),
    currentUser: currentUser
      ? { id: currentUser.id, name: currentUser.name, role: currentUser.role }
      : null,
    devCountry,
    countryTierInfo,
    countries: COUNTRIES,
  };
}

const statIcons = {
  courses: BookOpen,
  categories: GraduationCap,
  pace: Users,
} satisfies Record<HeroStat["key"], unknown>;

type FeaturedCourse =
  Route.ComponentProps["loaderData"]["featuredCourses"][number];

function CourseCard({
  course,
  eyebrow,
  className,
}: {
  course: FeaturedCourse;
  eyebrow?: string;
  className: string;
}) {
  return (
    <Link to={`/courses/${course.slug}`} className="group block">
      <Card className={`overflow-hidden pt-0 transition-shadow ${className}`}>
        <CourseImage
          src={course.coverImageUrl}
          alt={course.title}
          className="aspect-video w-full object-cover"
        />
        <CardHeader>
          {eyebrow && (
            <p className="text-xs font-medium uppercase tracking-wide text-primary">
              {eyebrow}
            </p>
          )}
          <h3 className="font-semibold leading-snug group-hover:text-primary">
            {course.title}
          </h3>
        </CardHeader>
        <CardContent>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {course.description}
          </p>
        </CardContent>
        <CardFooter className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="size-3" />
            {course.instructorName ?? "Instructor"}
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="size-3" />
            {course.lessonCount} lessons
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const {
    featuredCourses,
    totalCourses,
    totalCategories,
    users,
    currentUser,
    devCountry,
    countryTierInfo,
    countries,
  } = loaderData;
  const [isDark, setIsDark] = useState(false);
  const hero = landingHero({
    signedIn: currentUser !== null,
    totalCourses,
    totalCategories,
  });
  const [spotlight, ...moreCourses] = featuredCourses;

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleDarkMode() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("cadence-theme", next ? "dark" : "light");
    } catch {}
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="text-xl font-bold tracking-tight">
            Cadence
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              to="/courses"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Courses
            </Link>
            <button
              onClick={toggleDarkMode}
              className="rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </button>
            {currentUser ? (
              <Button asChild size="sm">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Log In
                </Link>
                <Button asChild size="sm">
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-transparent"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.15fr_1fr] lg:py-28">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" />
              Courses for working developers
            </p>
            <h1 className="mt-6 text-5xl font-bold tracking-tight sm:text-6xl">
              Learn to code,
              <br />
              <span className="text-muted-foreground">at your own pace</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Structured courses built by experienced instructors. Track your
              progress, take quizzes, and build real-world skills.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Button asChild size="lg">
                <Link to={hero.callsToAction.primary.to}>
                  {hero.callsToAction.primary.label}
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to={hero.callsToAction.secondary.to}>
                  {hero.callsToAction.secondary.label}
                </Link>
              </Button>
            </div>
            <dl className="mt-12 grid max-w-xl grid-cols-3 gap-6 border-t border-border pt-8">
              {hero.stats.map((stat) => {
                const Icon = statIcons[stat.key];
                return (
                  <div key={stat.key}>
                    <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Icon className="size-4 text-primary" />
                      {stat.label}
                    </dt>
                    <dd className="mt-1 text-2xl font-bold">{stat.value}</dd>
                  </div>
                );
              })}
            </dl>
          </div>

          {spotlight && (
            <CourseCard
              course={spotlight}
              eyebrow="Newest course"
              className="shadow-lg group-hover:shadow-xl"
            />
          )}
        </div>
      </section>

      {moreCourses.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                Featured Courses
              </h2>
              <p className="mt-2 text-muted-foreground">
                More of our newest courses
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/courses">
                View all
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {moreCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                className="h-full group-hover:shadow-md"
              />
            ))}
          </div>
        </section>
      )}

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Cadence</span>
          <Link
            to="/courses"
            className="transition-colors hover:text-foreground"
          >
            Browse courses
          </Link>
        </div>
      </footer>

      <DevUI
        users={users}
        currentUser={currentUser}
        devCountry={devCountry}
        countryTierInfo={countryTierInfo}
        countries={countries}
      />
    </div>
  );
}
