"use client";

import { useCreditsContext } from "@/contexts/credits-context";
import { Coins, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface CreditsDisplayProps {
  variant?: "compact" | "full";
  showAddButton?: boolean;
  className?: string;
}

export function CreditsDisplay({
  variant = "compact",
  showAddButton = false,
  className = "",
}: CreditsDisplayProps) {
  const { credits, isLoading } = useCreditsContext();
  const balance = credits?.balance || 0;

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-6" />
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-2 ${className}`}>
              <Coins className="h-4 w-4 text-yellow-500" />
              <Badge variant="secondary" className="font-mono">
                {balance}
              </Badge>
              {showAddButton && (
                <Button size="sm" variant="outline" className="h-6 w-6 p-0">
                  <Plus className="h-3 w-3" />
                </Button>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-medium">Seus Créditos</p>
              <p className="text-sm text-muted-foreground">
                Saldo atual: {balance} créditos
              </p>
              {credits && (
                <>
                  <p className="text-xs text-muted-foreground">
                    Total ganho: {credits.totalEarned}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total gasto: {credits.totalSpent}
                  </p>
                </>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Coins className="h-5 w-5 text-yellow-500" />
          Créditos
        </h3>
        {showAddButton && (
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            Adicionar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{balance}</div>
          <div className="text-xs text-muted-foreground">Saldo Atual</div>
        </div>

        {credits && (
          <>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {credits.totalEarned}
              </div>
              <div className="text-xs text-muted-foreground">Total Ganho</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {credits.totalSpent}
              </div>
              <div className="text-xs text-muted-foreground">Total Gasto</div>
            </div>
          </>
        )}
      </div>

      {credits && credits.recentTransactions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Transações Recentes</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {credits.recentTransactions.slice(0, 5).map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded"
              >
                <span className="truncate flex-1">
                  {transaction.description}
                </span>
                <span
                  className={`font-mono ${
                    transaction.amount > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {transaction.amount > 0 ? "+" : ""}
                  {transaction.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
