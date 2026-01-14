import { cn } from "@/lib/utils";
import { FlaskInlineLoader } from "@/components/ui/flask-loader";

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <FlaskInlineLoader
      data-slot="spinner"
      className={cn("size-4", className)}
      {...props}
    />
  );
}

export { Spinner };
