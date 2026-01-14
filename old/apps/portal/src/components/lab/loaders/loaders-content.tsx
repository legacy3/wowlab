"use client";

import { useState } from "react";
import {
  FlaskLoader,
  PageLoader,
  CardLoader,
  OverlayLoader,
  FlaskInlineLoader,
  FlaskButton,
} from "@/components/ui/flask-loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

type FlaskVariant = "loading" | "processing" | "idle";
type LoaderSize = "sm" | "md" | "lg" | "xl";

const variants: {
  id: FlaskVariant;
  name: string;
  description: string;
  useCase: string;
}[] = [
  {
    id: "loading",
    name: "Loading",
    description: "Smooth liquid rise and fall",
    useCase: "General loading, page transitions",
  },
  {
    id: "processing",
    name: "Processing",
    description: "Active bubbling with steam",
    useCase: "Heavy work, simulations",
  },
  {
    id: "idle",
    name: "Idle",
    description: "Subtle breathing pulse",
    useCase: "Ready state, waiting for input",
  },
];

const sizes: { id: LoaderSize; name: string; px: string }[] = [
  { id: "sm", name: "Small", px: "32px" },
  { id: "md", name: "Medium", px: "48px" },
  { id: "lg", name: "Large", px: "64px" },
  { id: "xl", name: "X-Large", px: "96px" },
];

export function LoadersContent() {
  const [selectedVariant, setSelectedVariant] =
    useState<FlaskVariant>("loading");
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const [isCardLoading, setIsCardLoading] = useState(true);
  const [isOverlayLoading, setIsOverlayLoading] = useState(false);

  const handleButtonClick = () => {
    setIsButtonLoading(true);
    setTimeout(() => setIsButtonLoading(false), 2500);
  };

  const handleCardRefresh = () => {
    setIsCardLoading(true);
    setTimeout(() => setIsCardLoading(false), 2000);
  };

  const handleOverlayClick = () => {
    setIsOverlayLoading(true);
    setTimeout(() => setIsOverlayLoading(false), 2500);
  };

  return (
    <div className="space-y-8">
      <Tabs defaultValue="variants" className="w-full">
        <TabsList>
          <TabsTrigger value="variants">Variants</TabsTrigger>
          <TabsTrigger value="contexts">Contexts</TabsTrigger>
          <TabsTrigger value="sizes">Sizes</TabsTrigger>
        </TabsList>

        {/* Variants Gallery */}
        <TabsContent value="variants" className="mt-6">
          <div className="grid gap-6 md:grid-cols-3">
            {variants.map((variant) => (
              <Card
                key={variant.id}
                className={`overflow-hidden cursor-pointer transition-all ${
                  selectedVariant === variant.id
                    ? "ring-2 ring-primary"
                    : "hover:border-primary/50"
                }`}
                onClick={() => setSelectedVariant(variant.id)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-base">
                    {variant.name}
                    <Badge variant="outline" className="font-mono text-xs">
                      {variant.id}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {variant.description}
                  </p>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4 py-8 bg-muted/30">
                  <FlaskLoader variant={variant.id} size="xl" />
                  <p className="text-xs text-muted-foreground text-center">
                    {variant.useCase}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Real Contexts */}
        <TabsContent value="contexts" className="mt-6 space-y-8">
          {/* Page Loader */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Page Loader</CardTitle>
              <p className="text-sm text-muted-foreground">
                Full-page loading state with optional message
              </p>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border bg-muted/20 min-h-[320px]">
                <PageLoader
                  variant={selectedVariant}
                  message="Loading your data ..."
                />
              </div>
              <div className="mt-4 p-3 rounded-lg bg-muted/50 font-mono text-xs">
                {`<PageLoader variant="${selectedVariant}" message="Loading ..." />`}
              </div>
            </CardContent>
          </Card>

          {/* Card States */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Card Loading States</CardTitle>
              <p className="text-sm text-muted-foreground">
                Loading indicators within card components
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {/* CardLoader */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      CardLoader
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCardRefresh}
                        disabled={isCardLoading}
                      >
                        Refresh
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="min-h-[180px]">
                    {isCardLoading ? (
                      <CardLoader
                        variant={selectedVariant}
                        message="Loading stats ..."
                      />
                    ) : (
                      <div className="space-y-3 py-4">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Total Spells
                          </span>
                          <span className="font-medium">1,247</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Coverage
                          </span>
                          <span className="font-medium">89.3%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Last Updated
                          </span>
                          <span className="font-medium">2 min ago</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* OverlayLoader */}
                <Card className="relative overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      OverlayLoader
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleOverlayClick}
                        disabled={isOverlayLoading}
                      >
                        Trigger
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="min-h-[180px]">
                    <div className="space-y-3 py-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Active Jobs
                        </span>
                        <span className="font-medium">3</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Queue Size
                        </span>
                        <span className="font-medium">12</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Status
                        </span>
                        <Badge variant="secondary">Running</Badge>
                      </div>
                    </div>
                    {isOverlayLoading && (
                      <OverlayLoader
                        variant={selectedVariant}
                        message="Syncing ..."
                      />
                    )}
                  </CardContent>
                </Card>
              </div>
              <div className="mt-4 p-3 rounded-lg bg-muted/50 font-mono text-xs space-y-1">
                <div>{`<CardLoader variant="${selectedVariant}" message="Loading ..." />`}</div>
                <div>{`<OverlayLoader variant="${selectedVariant}" message="Syncing ..." />`}</div>
              </div>
            </CardContent>
          </Card>

          {/* Button States */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Button Loading States</CardTitle>
              <p className="text-sm text-muted-foreground">
                FlaskButton component with built-in loading state
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-3">
                <FlaskButton loading>Processing</FlaskButton>
                <FlaskButton variant="secondary" loading>
                  Saving
                </FlaskButton>
                <FlaskButton
                  variant="outline"
                  onClick={handleButtonClick}
                  loading={isButtonLoading}
                >
                  Click to test
                </FlaskButton>
              </div>
              <div className="mt-4 p-3 rounded-lg bg-muted/50 font-mono text-xs space-y-1">
                <div>{`<FlaskButton loading>Processing</FlaskButton>`}</div>
                <div>{`<FlaskButton loading={isLoading} onClick={...}>Click</FlaskButton>`}</div>
              </div>
            </CardContent>
          </Card>

          {/* With Skeleton */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Combined with Skeleton
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Flask loader as a focal point with skeleton placeholders
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-4 p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <FlaskLoader variant={selectedVariant} size="md" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="h-20 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
                <div className="space-y-4 p-4 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <FlaskLoader variant={selectedVariant} size="sm" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sizes */}
        <TabsContent value="sizes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Size Comparison</CardTitle>
              <p className="text-sm text-muted-foreground">
                All sizes with the selected variant:{" "}
                <Badge variant="outline">{selectedVariant}</Badge>
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-end justify-center gap-8 py-8">
                {sizes.map((size) => (
                  <div
                    key={size.id}
                    className="flex flex-col items-center gap-3"
                  >
                    <FlaskLoader variant={selectedVariant} size={size.id} />
                    <div className="text-center">
                      <p className="text-sm font-medium">{size.name}</p>
                      <p className="text-xs text-muted-foreground">{size.px}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">
                Inline Size Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-6 py-4">
                <div className="flex items-center gap-2">
                  <FlaskInlineLoader />
                  <span className="text-sm text-muted-foreground">
                    Default (16px)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FlaskInlineLoader className="w-5 h-5" />
                  <span className="text-sm text-muted-foreground">20px</span>
                </div>
                <div className="flex items-center gap-2">
                  <FlaskInlineLoader className="w-6 h-6" />
                  <span className="text-sm text-muted-foreground">24px</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
