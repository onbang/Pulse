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
    <Card>
      <CardHeader>
        <CardTitle>Pool comments</CardTitle>
        <CardDescription>
          Leave a short note for liquidity providers. Max 200 characters.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="space-y-2 text-sm font-medium">
          {props.poolId
            ? `Comment for ${props.poolLabel}`
            : "Select a pool first to unlock comments"}
          <Textarea
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
            disabled={isDisabled}
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
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
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
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
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
