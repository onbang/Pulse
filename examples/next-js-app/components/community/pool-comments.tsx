"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  COMMENT_REACTION_EMOJIS,
  useCommunityProfile,
} from "./community-provider";

export function PoolComments(props: { poolId?: string; poolLabel: string }) {
  const { addComment, getComments, toggleCommentReaction, walletAddress } =
    useCommunityProfile();
  const [text, setText] = useState("");
  const comments = props.poolId ? getComments(props.poolId) : [];
  const isDisabled = !props.poolId || !walletAddress;

  return (
    <Card className="overflow-hidden rounded-[28px] border border-sky-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,248,255,0.96))] shadow-[0_28px_80px_-48px_rgba(15,23,42,0.18)]">
      <CardHeader>
        <CardTitle className="text-slate-900">Pool comments</CardTitle>
        <CardDescription className="text-slate-600">
          Leave a short note for liquidity providers. Max 200 characters.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="space-y-2 text-sm font-medium text-slate-800">
          {props.poolId
            ? `Comment for ${props.poolLabel}`
            : "Select a pool first to unlock comments"}
          <Textarea
            className="min-h-34 rounded-2xl border-sky-100 bg-white text-slate-900 shadow-none placeholder:text-slate-400"
            value={text}
            maxLength={200}
            disabled={isDisabled}
            onChange={(event) => setText(event.target.value)}
            placeholder="Share context about spread, volatility, rewards, or strategy."
          />
        </label>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500">{text.length}/200</span>
          <Button
            disabled={isDisabled || text.trim().length === 0}
            className="h-12 rounded-2xl bg-[linear-gradient(135deg,#0180FF,#3DB1FF)] px-6 text-white shadow-[0_20px_40px_-24px_rgba(1,128,255,0.55)] hover:opacity-95"
            onClick={async () => {
              if (!props.poolId) {
                return;
              }

              const added = await addComment({ poolId: props.poolId, text });
              if (added) {
                setText("");
              }
            }}
          >
            Post comment
          </Button>
        </div>
        {!walletAddress ? (
          <p className="text-sm text-slate-500">
            Connect your wallet to post through your profile.
          </p>
        ) : null}

        <div className="space-y-3">
          {comments.length === 0 ? (
            <p className="text-sm text-slate-500">
              No comments yet for this pool.
            </p>
          ) : (
            comments.map((comment) => (
              <article
                key={comment.id}
                className="rounded-2xl border border-sky-100 bg-white p-4 shadow-[0_16px_40px_-30px_rgba(15,23,42,0.18)]"
              >
                <div className="mb-2 flex items-center justify-between gap-3 text-xs text-slate-500">
                  <strong className="text-slate-700">{comment.author}</strong>
                  <span>{new Date(comment.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm text-slate-700">{comment.text}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {COMMENT_REACTION_EMOJIS.map((emoji) => {
                    const count = comment.reactions[emoji]?.length ?? 0;
                    const isActive =
                      !!walletAddress &&
                      (comment.reactions[emoji] ?? []).includes(walletAddress);

                    return (
                      <button
                        key={emoji}
                        type="button"
                        className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                          isActive
                            ? "border-sky-300 bg-sky-100 text-sky-900"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:border-sky-200 hover:bg-sky-50"
                        }`}
                        onClick={() => {
                          if (!props.poolId) {
                            return;
                          }

                          void toggleCommentReaction({
                            poolId: props.poolId,
                            commentId: comment.id,
                            emoji,
                          });
                        }}
                        disabled={!walletAddress}
                      >
                        {emoji} {count}
                      </button>
                    );
                  })}
                </div>
              </article>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
