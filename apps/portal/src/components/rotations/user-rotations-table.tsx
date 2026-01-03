"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDelete, useInvalidate } from "@refinedev/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Pencil,
  MoreHorizontal,
  Trash2,
  ExternalLink,
  Lock,
  Globe,
  GitFork,
} from "lucide-react";
import { SpecLabel } from "@/components/ui/spec-label";
import {
  SortableHeader,
  type SortDirection,
} from "@/components/ui/sortable-header";
import { useFuzzySearch } from "@/hooks/use-fuzzy-search";
import { formatRelativeToNow } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Rotation } from "@/lib/supabase/types";

type SortKey = "name" | "spec" | "updated" | null;

interface UserRotationsTableProps {
  rotations: Rotation[];
}

export function UserRotationsTable({ rotations }: UserRotationsTableProps) {
  const router = useRouter();
  const { mutateAsync: deleteRotation } = useDelete();
  const invalidate = useInvalidate();

  const [filter, setFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("updated");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [deleteTarget, setDeleteTarget] = useState<Rotation | null>(null);

  const { results: searchFiltered } = useFuzzySearch({
    items: rotations,
    query: filter,
    keys: ["name", "description"],
  });

  const sortedRotations = useMemo(() => {
    if (!sortKey) return searchFiltered;

    return [...searchFiltered].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "spec":
          cmp = a.specId - b.specId;
          break;
        case "updated": {
          const aTime = new Date(a.updatedAt).getTime();
          const bTime = new Date(b.updatedAt).getTime();
          cmp = aTime - bTime;
          break;
        }
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [searchFiltered, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    await deleteRotation({
      resource: "rotations",
      id: deleteTarget.id,
    });
    invalidate({ resource: "rotations", invalidates: ["list"] });
    setDeleteTarget(null);
  };

  return (
    <>
      <div className="space-y-4">
        <Input
          placeholder="Filter rotations..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-xs"
        />

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <SortableHeader
                  sortKey="name"
                  currentSort={sortKey}
                  currentDir={sortDir}
                  onSort={handleSort}
                >
                  Name
                </SortableHeader>
                <SortableHeader
                  sortKey="spec"
                  currentSort={sortKey}
                  currentDir={sortDir}
                  onSort={handleSort}
                  className="w-[180px]"
                >
                  Spec
                </SortableHeader>
                <TableHead className="w-[100px]">Visibility</TableHead>
                <SortableHeader
                  sortKey="updated"
                  currentSort={sortKey}
                  currentDir={sortDir}
                  onSort={handleSort}
                  className="w-[140px]"
                >
                  Updated
                </SortableHeader>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRotations.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {rotations.length === 0
                      ? "No rotations yet"
                      : "No rotations match the filter"}
                  </TableCell>
                </TableRow>
              ) : (
                sortedRotations.map((rotation) => (
                  <TableRow
                    key={rotation.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/rotations/${rotation.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{rotation.name}</span>
                        {rotation.forkedFromId && (
                          <GitFork className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </div>
                      {rotation.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                          {rotation.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <SpecLabel specId={rotation.specId} size="sm" />
                    </TableCell>
                    <TableCell>
                      {rotation.isPublic ? (
                        <Badge
                          variant="secondary"
                          className="bg-green-500/10 text-green-600 border-green-500/20"
                        >
                          <Globe className="mr-1 h-3 w-3" />
                          Public
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Lock className="mr-1 h-3 w-3" />
                          Private
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatRelativeToNow(rotation.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/rotations/editor/${rotation.id}`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/rotations/${rotation.id}`}>
                              <ExternalLink className="mr-2 h-4 w-4" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(rotation);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete rotation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteTarget?.name}". This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
