import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="top-right"
      richColors
      closeButton
      duration={3000}
      toastOptions={{
        duration: 3000,
        classNames: {
          toast:
            "group toast lov-toast relative overflow-hidden group-[.toaster]:bg-card group-[.toaster]:text-card-foreground group-[.toaster]:border group-[.toaster]:border-border/60 group-[.toaster]:shadow-elegant group-[.toaster]:rounded-xl group-[.toaster]:px-4 group-[.toaster]:py-3",
          title: "group-[.toast]:font-semibold group-[.toast]:text-sm",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-xs",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-md group-[.toast]:px-3 group-[.toast]:py-1.5",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toaster]:!border-emerald-500/50 group-[.toaster]:!bg-emerald-500/10 lov-toast-success",
          error: "group-[.toaster]:!border-destructive/50 group-[.toaster]:!bg-destructive/10 lov-toast-error",
          warning: "group-[.toaster]:!border-amber-500/50 group-[.toaster]:!bg-amber-500/10 lov-toast-warning",
          info: "group-[.toaster]:!border-sky-500/50 group-[.toaster]:!bg-sky-500/10 lov-toast-info",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
