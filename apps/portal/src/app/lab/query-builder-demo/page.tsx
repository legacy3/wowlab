import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ActionRotationBuilder,
  ExpressionDemo,
} from "@/components/query-builder-demo";

export default function QueryBuilderDemoPage() {
  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Rotation Builder</h1>
        <p className="text-muted-foreground">
          Build WoW rotation action lists with a visual editor.
        </p>
      </div>

      <Tabs defaultValue="expressions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="expressions">Expressions</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="expressions">
          <ExpressionDemo />
        </TabsContent>

        <TabsContent value="actions">
          <ActionRotationBuilder />
        </TabsContent>
      </Tabs>
    </div>
  );
}
