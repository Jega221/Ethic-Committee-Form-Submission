import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
    size?: "sm" | "md" | "lg";
    fullScreen?: boolean;
}

const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
};

export function Loader({ className, size = "md", fullScreen = false, ...props }: LoaderProps) {
    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" {...props}>
                <Loader2 className={cn("animate-spin text-primary", sizeClasses[size], className)} />
            </div>
        );
    }

    return (
        <div className={cn("flex items-center justify-center", className)} {...props}>
            <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
        </div>
    );
}
