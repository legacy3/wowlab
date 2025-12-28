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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useNodeAccess, useUpdateNodeAccess } from "@/hooks/nodes";
import { Globe, Users, User, Lock } from "lucide-react";
import { FlaskLoader, FlaskInlineLoader } from "@/components/ui/flask-loader";

interface NodeAccessSettingsProps {
  nodeId: string;
}

type AccessType = "owner" | "friends" | "guild" | "public";

const accessOptions: {
  value: AccessType;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "owner",
    label: "Only me",
    description: "Only you can use this node for simulations",
    icon: <Lock className="h-4 w-4" />,
  },
  {
    value: "friends",
    label: "My friends",
    description: "People on your friends list can use this node",
    icon: <User className="h-4 w-4" />,
  },
  {
    value: "guild",
    label: "My guild",
    description: "Members of your guild can use this node",
    icon: <Users className="h-4 w-4" />,
  },
  {
    value: "public",
    label: "Anyone",
    description: "This node is available to all WowLab users",
    icon: <Globe className="h-4 w-4" />,
  },
];

export function NodeAccessSettings({ nodeId }: NodeAccessSettingsProps) {
  const { data: currentAccess, isLoading } = useNodeAccess(nodeId);
  const { mutate: updateAccess, isPending } = useUpdateNodeAccess();
  const [selectedAccess, setSelectedAccess] = useState<AccessType>("owner");

  // Update local state when data loads
  if (currentAccess && selectedAccess !== currentAccess) {
    setSelectedAccess(currentAccess);
  }

  const handleSave = () => {
    updateAccess({ nodeId, accessType: selectedAccess });
  };

  const hasChanges = currentAccess !== selectedAccess;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Settings</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <FlaskLoader size="sm" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Access Settings</CardTitle>
        <CardDescription>
          Control who can use your node for running simulations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup
          value={selectedAccess}
          onValueChange={(value) => setSelectedAccess(value as AccessType)}
          className="space-y-3"
        >
          {accessOptions.map((option) => (
            <div
              key={option.value}
              className="flex items-start space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setSelectedAccess(option.value)}
            >
              <RadioGroupItem
                value={option.value}
                id={option.value}
                className="mt-1"
              />
              <div className="flex-1">
                <Label
                  htmlFor={option.value}
                  className="flex items-center gap-2 cursor-pointer font-medium"
                >
                  {option.icon}
                  {option.label}
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {option.description}
                </p>
              </div>
            </div>
          ))}
        </RadioGroup>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={!hasChanges || isPending}>
            {isPending && <FlaskInlineLoader className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
