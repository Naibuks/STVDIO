"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { ApiRequestError } from "@/services/api";
import { deleteComment, getComments, postComment } from "@/services/comments";
import type { Comment } from "@/types/api";

const relativeDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default function CommentSection({
  projectId,
  projectOwnerId,
}: {
  projectId: string;
  /** Lets the project's owner see a delete control on any comment. */
  projectOwnerId?: string;
}) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getComments(projectId)
      .then((data) => {
        if (!cancelled) setComments(data.comments);
      })
      .catch(() => {
        if (!cancelled) setComments([]);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const canDelete = (comment: Comment) =>
    Boolean(
      user &&
        (comment.user._id === user._id ||
          user.role === "ADMIN" ||
          (projectOwnerId && projectOwnerId === user._id)),
    );

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!content.trim()) return;

    setErrors([]);
    setPosting(true);
    try {
      const { comment } = await postComment(projectId, content);
      setComments((current) => [comment, ...(current ?? [])]);
      setContent("");
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setErrors(err.errors?.length ? err.errors : [err.message]);
      } else {
        setErrors([err instanceof Error ? err.message : "Could not post"]);
      }
    } finally {
      setPosting(false);
    }
  };

  const onDelete = async (id: string) => {
    const previous = comments;
    setComments((current) => (current ?? []).filter((c) => c._id !== id));
    try {
      await deleteComment(id);
    } catch (err) {
      setComments(previous ?? []);
      setErrors([err instanceof Error ? err.message : "Could not delete"]);
    }
  };

  return (
    <section className="mt-12 border-t border-current/15 pt-8">
      <h2 className="font-mono text-[0.65rem] uppercase tracking-widest text-current/50">
        Comments{comments ? ` — ${comments.length}` : ""}
      </h2>

      {user ? (
        <form onSubmit={onSubmit} className="mt-5">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Leave a note…"
            className="w-full resize-y border-b border-current/30 bg-transparent py-2 outline-none focus:border-current"
          />
          <div className="mt-3 flex items-center gap-3">
            <button
              type="submit"
              disabled={posting || !content.trim()}
              className="border border-current px-4 py-2 font-mono text-[0.65rem] uppercase tracking-widest hover:bg-current/5 disabled:opacity-40"
            >
              {posting ? "Posting…" : "Post"}
            </button>
            <span className="font-mono text-[0.6rem] uppercase tracking-widest text-current/30">
              {content.length}/1000
            </span>
          </div>
        </form>
      ) : (
        <p className="mt-5 font-mono text-[0.65rem] uppercase tracking-widest text-current/50">
          <Link href="/login" className="underline underline-offset-4">
            Sign in
          </Link>{" "}
          to join the conversation
        </p>
      )}

      {errors.length > 0 && (
        <ul role="alert" className="mt-4 space-y-1 text-sm text-red-500">
          {errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}

      <div className="mt-8 space-y-6">
        {comments === null && (
          <p className="font-mono text-[0.65rem] uppercase tracking-widest text-current/40">
            Loading…
          </p>
        )}

        {comments?.length === 0 && (
          <p className="font-mono text-[0.65rem] uppercase tracking-widest text-current/40">
            No comments yet
          </p>
        )}

        {comments?.map((comment) => (
          <article
            key={comment._id}
            className="border-t border-current/10 pt-5 first:border-0 first:pt-0"
          >
            <div className="flex items-baseline justify-between gap-4">
              <p className="font-mono text-[0.65rem] uppercase tracking-widest">
                <Link
                  href={`/profile/${comment.user.username}`}
                  className="underline underline-offset-4 hover:opacity-60"
                >
                  {comment.user.name}
                </Link>
                <span className="ml-2 text-current/40">
                  {relativeDate(comment.createdAt)}
                </span>
              </p>

              {canDelete(comment) && (
                <button
                  type="button"
                  onClick={() => onDelete(comment._id)}
                  className="font-mono text-[0.6rem] uppercase tracking-widest text-current/40 hover:text-red-500"
                >
                  Delete
                </button>
              )}
            </div>
            <p className="mt-2 whitespace-pre-line leading-relaxed text-current/80">
              {comment.content}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
