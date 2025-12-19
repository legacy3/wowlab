import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  className?: string;
  value: string;
  label: string;
}

export function CopyButton({ className, value, label }: CopyButtonProps) {
  const [state, copyToClipboard] = useCopyToClipboard(label);

  const handleCopy = () => {
    copyToClipboard(value);
  };

  return (
    <Button
      data-slot="copy-button"
      variant="ghost"
      size="icon-sm"
      className={cn(
        "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        className,
      )}
      onClick={handleCopy}
    >
      {state.copied ? (
        <Check className="text-green-500 animate-in zoom-in-50 duration-200" />
      ) : (
        <Copy />
      )}
    </Button>
  );
}
