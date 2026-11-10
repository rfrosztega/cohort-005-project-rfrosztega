// PROTOTYPE — throwaway. Answers "What does the notifications experience look like
// inside the app?" (wayfinder ticket #4). Four variants of the in-app Notifications
// experience, mounted in the real app shell (`layout.app.tsx`), switchable via `?variant=`.
// Fake catalogue held in memory; no persistence, no real mutations.
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  Mail,
  MessageSquare,
  PlayCircle,
  Receipt,
  UsersRound,
  X,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { UserRole } from "~/db/schema";
import { UserAvatar } from "~/components/user-avatar";

export const NOTIFICATION_VARIANTS = [
  { key: "A", name: "Sidebar bell + popover" },
  { key: "B", name: "Inbox nav item + full page" },
  { key: "C", name: "Top bar + drawer by course" },
  { key: "D", name: "Inline strip, no bell" },
];

export type PrototypeLinks = {
  courseTitle: string;
  courseSlug: string;
  lessonId: number;
  lessonTitle: string;
} | null;

type NotificationType =
  | "reply"
  | "answered"
  | "question"
  | "new-lesson"
  | "refund-approved"
  | "refund-declined"
  | "refund-issued"
  | "seat-claimed";

type FakeNotification = {
  id: number;
  type: NotificationType;
  actor: string | null;
  title: string;
  snippet: string | null;
  course: string;
  href: string;
  when: string;
  emailed: boolean;
  read: boolean;
};

function buildCatalogue(
  role: UserRole | null,
  isTeamAdmin: boolean,
  links: PrototypeLinks
): FakeNotification[] {
  const course = links?.courseTitle ?? "Intro to React Router";
  const slug = links?.courseSlug ?? "intro-to-react-router";
  const lessonTitle = links?.lessonTitle ?? "Loaders and actions";
  const lessonHref = `/courses/${slug}/lessons/${links?.lessonId ?? 1}`;
  let id = 1;
  const n = (
    x: Omit<FakeNotification, "id" | "course" | "read"> & {
      read?: boolean;
      course?: string;
    }
  ): FakeNotification => ({ id: id++, course, read: false, ...x });

  if (role === UserRole.Instructor) {
    return [
      n({ type: "question", actor: "Sam Lee", title: `Sam Lee asked a Question on “${lessonTitle}”`, snippet: "Why does the loader run twice when I navigate back?", href: `${lessonHref}#comment-101`, when: "3m", emailed: false }),
      n({ type: "question", actor: "Priya Shah", title: `Priya Shah asked a Question on “${lessonTitle}”`, snippet: "Is there a way to share data between two sibling routes?", href: `${lessonHref}#comment-102`, when: "40m", emailed: false }),
      n({ type: "reply", actor: "Sam Lee", title: "Sam Lee replied to your Comment", snippet: "Thanks, that cleared it up — the redirect was the issue.", href: `${lessonHref}#comment-88`, when: "3h", emailed: true }),
      n({ type: "question", actor: "Jordan Park", title: `Jordan Park asked a Question on “${lessonTitle}”`, snippet: "The repo link on this lesson 404s for me.", href: `${lessonHref}#comment-97`, when: "1h", emailed: false }),
      n({ type: "question", actor: "Alex Kim", title: `Alex Kim asked a Question on “${lessonTitle}”`, snippet: "Should actions validate on the server even with client checks?", href: `${lessonHref}#comment-80`, when: "2d", emailed: false, read: true }),
      n({ type: "question", actor: "Maria Lopez", title: `Maria Lopez asked a Question on “${lessonTitle}”`, snippet: "What's the difference between redirect and navigate here?", href: `${lessonHref}#comment-71`, when: "5d", emailed: false, read: true }),
    ];
  }

  if (role === UserRole.Student) {
    const items = [
      n({ type: "answered", actor: "Dana Ortiz", title: "Dana Ortiz answered your Question", snippet: "Good catch — the loader re-runs because the search params changed. Use shouldRevalidate.", href: `${lessonHref}#comment-120`, when: "12m", emailed: true }),
      n({ type: "reply", actor: "Priya Shah", title: "Priya Shah replied to your Comment", snippet: "I had the same issue, upgrading fixed it for me.", href: `${lessonHref}#comment-118`, when: "2h", emailed: true }),
      n({ type: "new-lesson", actor: null, title: `New lesson: “Streaming with defer”`, snippet: null, href: `/courses/${slug}`, when: "5h", emailed: false }),
      n({ type: "refund-approved", actor: null, title: "Your Refund Request was approved", snippet: "Your Enrollment has ended. The refund will be issued shortly.", href: "/settings", when: "2d", emailed: true, read: true, course: "Advanced TypeScript Patterns" }),
      n({ type: "refund-issued", actor: null, title: "Your refund of $49.00 has been issued", snippet: "It may take 5–10 days to appear on your statement.", href: "/settings", when: "3d", emailed: true, read: true, course: "Advanced TypeScript Patterns" }),
      n({ type: "refund-declined", actor: null, title: "Your Refund Request was declined", snippet: "The refund window had closed. You can raise a new Refund Request if something changed.", href: `/courses/${slug}`, when: "1w", emailed: true, read: true }),
    ];
    if (isTeamAdmin) {
      items.splice(
        1,
        0,
        n({ type: "seat-claimed", actor: "Alex Kim", title: "Alex Kim claimed a Seat on your Team Licence", snippet: "4 of 10 Seats now claimed.", href: "/team", when: "1h", emailed: false })
      );
    }
    return items;
  }

  return [];
}

function useFakeNotifications(
  role: UserRole | null,
  isTeamAdmin: boolean,
  links: PrototypeLinks
) {
  const initial = useMemo(
    () => buildCatalogue(role, isTeamAdmin, links),
    [role, isTeamAdmin, links?.courseSlug, links?.lessonId]
  );
  const [items, setItems] = useState(initial);
  useEffect(() => setItems(initial), [initial]);
  const navigate = useNavigate();

  return {
    items,
    unread: items.filter((i) => !i.read).length,
    open(item: FakeNotification) {
      setItems((xs) => xs.map((x) => (x.id === item.id ? { ...x, read: true } : x)));
      navigate(item.href);
    },
    toggleRead(id: number) {
      setItems((xs) => xs.map((x) => (x.id === id ? { ...x, read: !x.read } : x)));
    },
    markAllRead() {
      setItems((xs) => xs.map((x) => ({ ...x, read: true })));
    },
    reset() {
      setItems(initial);
    },
  };
}

type Feed = ReturnType<typeof useFakeNotifications>;

const ICONS: Record<NotificationType, React.ReactNode> = {
  reply: <MessageSquare className="size-4" />,
  answered: <CheckCircle2 className="size-4 text-emerald-600" />,
  question: <HelpCircle className="size-4 text-amber-600" />,
  "new-lesson": <PlayCircle className="size-4 text-sky-600" />,
  "refund-approved": <Receipt className="size-4 text-emerald-600" />,
  "refund-declined": <Receipt className="size-4 text-rose-600" />,
  "refund-issued": <Receipt className="size-4" />,
  "seat-claimed": <UsersRound className="size-4" />,
};

function Badge({ count, className }: { count: number; className?: string }) {
  if (count === 0) return null;
  return (
    <span
      className={cn(
        "flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white",
        className
      )}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

function EmptyState({ role }: { role: UserRole | null }) {
  return (
    <div className="p-6 text-center text-sm text-muted-foreground">
      You're all caught up.
      {role === UserRole.Admin && (
        <div className="mt-1 text-xs">
          (Platform Admins get no Notifications yet: out of scope.)
        </div>
      )}
    </div>
  );
}

// ─── Variant A: bell next to the logo, compact popover, "see all" goes nowhere ───
function VariantABell({ feed, role }: { feed: Feed; role: UserRole | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <div ref={ref} className="relative ml-auto">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-md p-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent"
        title="Notifications"
      >
        <Bell className="size-5" />
        <Badge count={feed.unread} className="absolute -right-0.5 -top-0.5" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-96 overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-xl">
          <div className="flex items-center justify-between border-b px-4 py-2.5">
            <span className="text-sm font-semibold">Notifications</span>
            {feed.unread > 0 && (
              <button onClick={feed.markAllRead} className="text-xs text-primary hover:underline">
                Mark all read
              </button>
            )}
          </div>
          {feed.items.length === 0 ? (
            <EmptyState role={role} />
          ) : (
            <ul className="max-h-[28rem] overflow-y-auto">
              {feed.items.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setOpen(false);
                      feed.open(item);
                    }}
                    className={cn(
                      "flex w-full items-start gap-3 border-b px-4 py-3 text-left text-sm hover:bg-accent",
                      !item.read && "bg-primary/5"
                    )}
                  >
                    <span className="mt-0.5 shrink-0">{ICONS[item.type]}</span>
                    <span className="min-w-0 flex-1">
                      <span className={cn("block", !item.read && "font-semibold")}>{item.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">{item.course}</span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">{item.when}</span>
                    {!item.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Variant B: "Notifications" nav item + full inbox page in the main area ───
function VariantBNavItem({ feed, onOpen, active }: { feed: Feed; onOpen: () => void; active: boolean }) {
  return (
    <button
      onClick={onOpen}
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <Bell className="size-4" />
      Notifications
      <Badge count={feed.unread} className="ml-auto" />
    </button>
  );
}

function VariantBInbox({ feed, role }: { feed: Feed; role: UserRole | null }) {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const shown = feed.items.filter((i) => filter === "all" || !i.read);
  const groups = [
    { label: "New", items: shown.filter((i) => /m$|h$/.test(i.when)) },
    { label: "Earlier", items: shown.filter((i) => !/m$|h$/.test(i.when)) },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="mx-auto max-w-3xl p-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {feed.unread} unread
            {role === UserRole.Instructor && (
              <>
                {" · "}
                <Link to="/instructor/questions" className="text-primary hover:underline">
                  Open the questions queue
                </Link>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border p-0.5 text-sm">
            {(["all", "unread"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn("rounded px-3 py-1 capitalize", filter === f && "bg-accent font-medium")}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={feed.markAllRead}
            disabled={feed.unread === 0}
            className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm disabled:opacity-40"
          >
            <CheckCheck className="size-4" /> Mark all read
          </button>
        </div>
      </div>

      {groups.length === 0 && <EmptyState role={role} />}
      {groups.map((g) => (
        <section key={g.label} className="mb-8">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{g.label}</h2>
          <ul className="divide-y rounded-lg border">
            {g.items.map((item) => (
              <li key={item.id} className={cn("group flex gap-4 p-4", !item.read && "bg-primary/5")}>
                {item.actor ? (
                  <UserAvatar name={item.actor} avatarUrl={null} />
                ) : (
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    {ICONS[item.type]}
                  </span>
                )}
                <button onClick={() => feed.open(item)} className="min-w-0 flex-1 text-left">
                  <div className={cn("text-sm", !item.read && "font-semibold")}>{item.title}</div>
                  {item.snippet && (
                    <div className="mt-1 line-clamp-2 rounded border-l-2 pl-2 text-sm text-muted-foreground">
                      {item.snippet}
                    </div>
                  )}
                  <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{item.course}</span>
                    <span>·</span>
                    <span>{item.when} ago</span>
                    {item.emailed && (
                      <span className="flex items-center gap-1" title="Also sent by email">
                        · <Mail className="size-3" /> emailed
                      </span>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => feed.toggleRead(item.id)}
                  className="self-start text-xs text-muted-foreground opacity-0 hover:text-foreground group-hover:opacity-100"
                >
                  Mark {item.read ? "unread" : "read"}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

// ─── Variant C: top bar over the content, slide-over drawer grouped by course ───
function VariantCTopBar({ feed, role }: { feed: Feed; role: UserRole | null }) {
  const [open, setOpen] = useState(false);
  const byCourse = feed.items.reduce<Record<string, FakeNotification[]>>((acc, i) => {
    (acc[i.course] ??= []).push(i);
    return acc;
  }, {});

  return (
    <>
      <div className="sticky top-0 z-30 flex h-14 items-center justify-end border-b bg-background/95 px-6 backdrop-blur">
        <button
          onClick={() => setOpen(true)}
          title="Notifications"
          aria-label={feed.unread > 0 ? `Notifications, ${feed.unread} new` : "Notifications"}
          className={cn(
            "relative flex items-center gap-2 rounded-full border py-1.5 text-sm hover:bg-accent",
            feed.unread > 0 ? "px-3" : "px-1.5"
          )}
        >
          <Bell className="size-4" />
          {feed.unread > 0 && `${feed.unread} new`}
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={() => setOpen(false)}>
          <aside
            onClick={(e) => e.stopPropagation()}
            className="flex h-full w-[26rem] flex-col border-l bg-background shadow-2xl"
          >
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="font-semibold">Notifications</h2>
              <div className="flex items-center gap-3">
                <button onClick={feed.markAllRead} className="text-xs text-primary hover:underline">
                  Mark all read
                </button>
                <button onClick={() => setOpen(false)}>
                  <X className="size-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {feed.items.length === 0 && <EmptyState role={role} />}
              {Object.entries(byCourse).map(([course, items]) => {
                const unread = items.filter((i) => !i.read).length;
                return (
                  <section key={course} className="border-b">
                    <div className="flex items-center justify-between bg-muted/50 px-5 py-2">
                      <span className="truncate text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {course}
                      </span>
                      <Badge count={unread} />
                    </div>
                    {items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setOpen(false);
                          feed.open(item);
                        }}
                        className={cn(
                          "flex w-full items-start gap-3 px-5 py-3 text-left hover:bg-accent",
                          item.read && "opacity-60"
                        )}
                      >
                        <span className="mt-0.5">{ICONS[item.type]}</span>
                        <span className="min-w-0 flex-1 text-sm">
                          <span className="block">{item.title}</span>
                          {item.snippet && (
                            <span className="block truncate text-xs text-muted-foreground">{item.snippet}</span>
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground">{item.when}</span>
                        <ChevronRight className="mt-0.5 size-4 text-muted-foreground" />
                      </button>
                    ))}
                  </section>
                );
              })}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

// ─── Variant D: no bell. Unread Notifications surface inline at the top of every page, one at a time ───
function VariantDStrip({ feed }: { feed: Feed }) {
  const unread = feed.items.filter((i) => !i.read);
  const [idx, setIdx] = useState(0);
  if (unread.length === 0) return null;
  const item = unread[Math.min(idx, unread.length - 1)];

  return (
    <div className="sticky top-0 z-30 border-b bg-amber-50 px-6 py-3 dark:bg-amber-950/40">
      <div className="mx-auto flex max-w-5xl items-center gap-4">
        <span className="shrink-0">{ICONS[item.type]}</span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium">{item.title}</div>
          {item.snippet && <div className="truncate text-xs text-muted-foreground">“{item.snippet}”</div>}
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {Math.min(idx, unread.length - 1) + 1} of {unread.length}
        </span>
        <button onClick={() => feed.open(item)} className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
          View
        </button>
        <button onClick={() => feed.toggleRead(item.id)} className="shrink-0 text-xs text-muted-foreground hover:text-foreground">
          Dismiss
        </button>
        {unread.length > 1 && (
          <button onClick={() => setIdx((i) => (i + 1) % unread.length)} className="shrink-0 text-xs text-muted-foreground hover:text-foreground">
            Next →
          </button>
        )}
        <button onClick={feed.markAllRead} className="shrink-0 text-xs text-muted-foreground hover:text-foreground">
          Dismiss all
        </button>
      </div>
    </div>
  );
}

// ─── Composition: what the layout mounts ───
export function useNotificationsPrototype({
  variant,
  role,
  isTeamAdmin,
  links,
  pathname,
}: {
  variant: string;
  role: UserRole | null;
  isTeamAdmin: boolean;
  links: PrototypeLinks;
  pathname: string;
}) {
  const feed = useFakeNotifications(role, isTeamAdmin, links);
  const [inboxOpen, setInboxOpen] = useState(false);
  useEffect(() => setInboxOpen(false), [pathname, variant]);
  const signedIn = role !== null;

  return {
    status: `${feed.unread} unread / ${feed.items.length} · ${role ?? "signed out"}`,
    reset: feed.reset,
    sidebarHeader: signedIn && variant === "A" ? <VariantABell feed={feed} role={role} /> : null,
    sidebarNav:
      signedIn && variant === "B" ? (
        <VariantBNavItem feed={feed} active={inboxOpen} onOpen={() => setInboxOpen(true)} />
      ) : null,
    mainTop: !signedIn
      ? null
      : variant === "C"
        ? <VariantCTopBar feed={feed} role={role} />
        : variant === "D"
          ? <VariantDStrip feed={feed} />
          : null,
    mainOverride: signedIn && variant === "B" && inboxOpen ? <VariantBInbox feed={feed} role={role} /> : null,
  };
}

