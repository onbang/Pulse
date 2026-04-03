"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import type { AssetInfo } from "@/hooks/use-assets-query";
import { Formatter } from "@/lib/formatter";
import { cn } from "@/lib/utils";

type AssetSelectProps = {
  assets?: AssetInfo[];
  selectedAsset: AssetInfo | null;
  onAssetSelect?: (asset: AssetInfo | null) => void;
  className?: string;
  loading?: boolean;
};

export function AssetSelect({
  assets = [],
  selectedAsset,
  onAssetSelect,
  loading,
  className,
}: AssetSelectProps) {
  const [open, setOpen] = useState(false);

  const handleAssetSelect = (assetAddress: string) => {
    const asset = assets.find(
      (asset) => asset.contractAddress === assetAddress,
    );

    if (asset && onAssetSelect) {
      onAssetSelect(asset);
    }

    setOpen(false);
  };

  const handleFilter = (_: string, search: string, keywords: string[] = []) => {
    const [symbol = ""] = keywords;
    return symbol.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
  };

  if (loading) {
    return <Skeleton className={cn("w-full h-10", className)} />;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          aria-expanded={open}
          className={cn(
            "h-13 w-full rounded-2xl border-white/10 bg-white/5 px-3! text-sm font-semibold text-white hover:bg-white/10",
            className,
          )}
        >
          {selectedAsset ? (
            <>
              <Avatar className="size-6">
                <AvatarImage
                  src={selectedAsset.meta?.imageUrl}
                  alt={
                    selectedAsset.meta?.displayName ??
                    selectedAsset.meta?.symbol
                  }
                />
              </Avatar>
              {selectedAsset.meta?.symbol}
            </>
          ) : (
            "Select asset..."
          )}
          <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[320px] border-white/10 bg-[#101526] p-0 text-white shadow-[0_24px_70px_-34px_rgba(0,0,0,0.95)]"
        avoidCollisions={false}
      >
        <Command filter={handleFilter}>
          <CommandInput placeholder="Search asset..." />
          <CommandList>
            <CommandEmpty>No asset found.</CommandEmpty>
            <CommandGroup>
              {assets.map((asset) => (
                <CommandItem
                  className="flex gap-2"
                  key={asset.contractAddress}
                  value={asset.contractAddress}
                  keywords={[asset.meta?.symbol].filter(Boolean)}
                  onSelect={handleAssetSelect}
                >
                  <Avatar className="w-6 h-6 aspect-square">
                    <AvatarImage
                      src={asset.meta?.imageUrl}
                      alt={asset.meta?.displayName ?? asset.meta?.symbol}
                    />
                    <AvatarFallback>
                      <Skeleton className="rounded-full" />
                    </AvatarFallback>
                  </Avatar>
                  {asset.meta?.symbol}

                  {asset.balance ? (
                    <pre className="ml-auto">
                      {Formatter.units(
                        asset.balance,
                        asset.meta?.decimals ?? 9,
                      )}
                    </pre>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
