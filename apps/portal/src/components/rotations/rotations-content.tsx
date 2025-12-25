"use client";

import { useState, useMemo } from "react";
import { useList } from "@refinedev/core";
import { RotationsList } from "./rotations-list";
import { Card, CardContent } from "@/components/ui/card";
import {
  Skeleton,
  SearchBarSkeleton,
  CardGridSkeleton,
} from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Filter, Library, Search, X } from "lucide-react";
import { useFuzzySearch } from "@/hooks/use-fuzzy-search";
import type { Rotation } from "@/lib/supabase/types";
import { RotationsBrowseTour } from "@/components/tours";
import { useClassesAndSpecs } from "@/hooks/use-classes-and-specs";

function RotationsBrowseSkeleton() {
  return (
    <div className="space-y-4">
      <SearchBarSkeleton />
      <Skeleton className="h-4 w-48" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-6 w-32" />
          <CardGridSkeleton count={3} columns={3} cardHeight="h-48" />
        </div>
      ))}
    </div>
  );
}

export function RotationsBrowse() {
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const { classes, specs } = useClassesAndSpecs();

  const {
    result,
    query: { isLoading, isError },
  } = useList<Rotation>({
    resource: "rotations",
    filters: [{ field: "isPublic", operator: "eq", value: true }],
    sorters: [{ field: "updatedAt", order: "desc" }],
    pagination: { pageSize: 50 },
  });

  const rotations = useMemo(() => result?.data ?? [], [result?.data]);

  const classIdBySpecId = useMemo(() => {
    return new Map(
      (specs.result?.data ?? []).map((spec) => [spec.ID, spec.ClassID]),
    );
  }, [specs.result?.data]);

  const classFilteredRotations = useMemo(() => {
    if (classFilter === "all") {
      return rotations;
    }

    const classId = Number(classFilter);
    return rotations.filter((r) => classIdBySpecId.get(r.specId) === classId);
  }, [rotations, classFilter, classIdBySpecId]);

  const { results: filteredRotations } = useFuzzySearch({
    items: classFilteredRotations,
    query: searchQuery,
    keys: ["name", "description"],
    threshold: 0.4,
  });

  if (isLoading) {
    return <RotationsBrowseSkeleton />;
  }

  if (isError) {
    return <div>Error loading rotations</div>;
  }

  if (rotations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Library className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No rotations yet</p>
          <p className="text-sm text-muted-foreground">
            Check back soon for community rotations
          </p>
        </CardContent>
      </Card>
    );
  }

  const activeFilterCount = classFilter !== "all" ? 1 : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md" data-tour="rotations-search">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search rotations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          data-tour="rotations-filters"
        >
          <Filter className="mr-2 h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Class</label>
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {(classes.result?.data ?? []).map((cls) => (
                      <SelectItem key={cls.ID} value={String(cls.ID)}>
                        {cls.Name_lang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setClassFilter("all");
                    setSearchQuery("");
                  }}
                  className="w-full"
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>
          Showing {filteredRotations.length} of {rotations.length} rotations
        </p>
      </div>

      <RotationsList rotations={filteredRotations} groupByClass={true} />

      <RotationsBrowseTour show={rotations.length > 0} />
    </div>
  );
}
