import { Address } from "@ton/core";
import { NextResponse } from "next/server";

import { jsonRouteError } from "@/lib/server/api-route-error";
import { tonConsoleClient } from "@/lib/ton-console-client";

export async function GET(
  _request: Request,
  context: { params: Promise<{ wallet: string }> },
) {
  const { wallet } = await context.params;

  try {
    const accountAddress = Address.parse(wallet);

    const [account, jettons, events] = await Promise.all([
      tonConsoleClient.accounts.getAccount(accountAddress),
      tonConsoleClient.accounts.getAccountJettonsBalances(accountAddress, {
        currencies: ["usd"],
      }),
      tonConsoleClient.accounts.getAccountEvents(accountAddress, {
        limit: 6,
        subject_only: true,
      }),
    ]);

    return NextResponse.json({
      ok: true,
      account: {
        address: account.address,
        name: account.name ?? null,
        balance: account.balance.toString(),
        status: account.status,
        lastActivity: account.lastActivity,
      },
      jettons: jettons.balances.slice(0, 6).map((item) => ({
        symbol: item.jetton.symbol ?? item.jetton.name ?? "JETTON",
        name: item.jetton.name ?? item.jetton.symbol ?? "Jetton",
        balance: item.balance.toString(),
        decimals: item.jetton.decimals ?? 9,
        image: item.jetton.image ?? null,
      })),
      events: events.events.map((event) => ({
        eventId: event.eventId,
        timestamp: event.timestamp,
        isScam: event.isScam,
        inProgress: event.inProgress,
        actions: event.actions.slice(0, 2).map((action) => ({
          type: action.type,
          status: action.status,
          description: action.simplePreview.description,
          name: action.simplePreview.name,
          value: action.simplePreview.value ?? null,
        })),
      })),
    });
  } catch (error) {
    return jsonRouteError({
      request: _request,
      scope: "api.ton.profile.get",
      error,
      fallbackMessage: "Failed to load TON profile",
      metadata: {
        wallet,
      },
    });
  }
}
