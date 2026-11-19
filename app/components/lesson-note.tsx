import { useState } from "react";
import { useFetcher } from "react-router";
import { ChevronDown, NotebookPen } from "lucide-react";
import { notePreview } from "~/modules/lesson-note";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { cn, formatRelativeTime } from "~/lib/utils";

type Note = { body: string; updatedAt: string } | null;

const EDITOR_ID = "lesson-note-editor";

/**
 * The Student's private Note on a Lesson. It starts collapsed to one row so a
 * Student who does not take notes can read past it.
 */
export function LessonNote({ note }: { note: Note }) {
  const [open, setOpen] = useState(false);
  const preview = notePreview(note?.body);

  return (
    <section className="mb-8 rounded-lg border">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={EDITOR_ID}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        className="flex w-full items-center gap-2 rounded-lg px-4 py-3 text-left text-sm hover:bg-muted/50"
      >
        <NotebookPen className="size-4 shrink-0 text-muted-foreground" />
        <span className="font-medium">
          {preview ? "Your note" : "Add a note"}
        </span>
        {preview && !open && (
          <span className="truncate text-muted-foreground">{preview}</span>
        )}
        <ChevronDown
          className={cn(
            "ml-auto size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      <NoteEditor note={note} hidden={!open} />
    </section>
  );
}

function NoteEditor({ note, hidden }: { note: Note; hidden: boolean }) {
  const fetcher = useFetcher<{ ok: boolean; error?: string }>();
  const isSaving = fetcher.state !== "idle";
  const error = fetcher.data?.error;

  return (
    <fetcher.Form
      id={EDITOR_ID}
      method="post"
      hidden={hidden}
      className="space-y-3 border-t px-4 py-3"
    >
      <input type="hidden" name="intent" value="save-note" />
      <Textarea
        name="body"
        rows={4}
        defaultValue={note?.body ?? ""}
        placeholder="Only you can read this."
        aria-label="Your note"
        className="resize-y"
      />
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save"}
        </Button>
        {error && <span className="text-sm text-red-600">{error}</span>}
        {!error && note && (
          <span
            suppressHydrationWarning
            className="text-xs text-muted-foreground"
          >
            Last edited {formatRelativeTime(note.updatedAt)}
          </span>
        )}
      </div>
    </fetcher.Form>
  );
}
