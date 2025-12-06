"use client";

import { useState } from "react";
import { useList } from "@refinedev/core";
import { RotationsList } from "./rotations-list";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import type { Rotation } from "@/lib/supabase/types";

function RotationsBrowseSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-6 w-32" />
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((j) => (
              <Skeleton key={j} className="h-48" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function RotationsBrowse() {
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const {
    result,
    query: { isLoading, isError },
  } = useList<Rotation>({
    resource: "rotations",
    filters: [
      { field: "visibility", operator: "eq", value: "public" },
      { field: "status", operator: "eq", value: "approved" },
      { field: "deletedAt", operator: "null", value: true },
    ],
    sorters: [{ field: "updatedAt", order: "desc" }],
    pagination: { pageSize: 50 },
  });

  if (isLoading) {
    return <RotationsBrowseSkeleton />;
  }

  if (isError) {
    return <div>Error loading rotations</div>;
  }

  const rotations = result?.data ?? [];

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

  const filteredRotations = rotations.filter((rotation) => {
    const matchesSearch =
      searchQuery === "" ||
      rotation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rotation.spec.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rotation.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClass =
      classFilter === "all" || rotation.class === classFilter;
    const matchesStatus =
      statusFilter === "all" || rotation.status === statusFilter;

    return matchesSearch && matchesClass && matchesStatus;
  });

  const activeFilterCount =
    (classFilter !== "all" ? 1 : 0) + (statusFilter !== "all" ? 1 : 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Class</label>
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    <SelectItem value="Priest">Priest</SelectItem>
                    <SelectItem value="Mage">Mage</SelectItem>
                    <SelectItem value="Warlock">Warlock</SelectItem>
                    <SelectItem value="Paladin">Paladin</SelectItem>
                    <SelectItem value="Druid">Druid</SelectItem>
                    <SelectItem value="Shaman">Shaman</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setClassFilter("all");
                    setStatusFilter("all");
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
    </div>
  );
}
