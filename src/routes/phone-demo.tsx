import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { PhoneInput, PhoneDisplay } from "@/components/ui/phone-input";

export const Route = createFileRoute("/phone-demo")({
  component: PhoneDemoPage,
  head: () => ({
    meta: [
      { title: "Phone input — preview" },
      { name: "description", content: "Premium Egyptian phone input component preview." },
    ],
  }),
});

function PhoneDemoPage() {
  const [value, setValue] = React.useState("");
  const [valid, setValid] = React.useState(false);

  return (
    <div className="min-h-dvh bg-gradient-to-b from-background to-muted/30 px-4 py-12">
      <div className="mx-auto w-full max-w-2xl space-y-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Phone input</h1>
          <p className="text-sm text-muted-foreground">
            Premium Egyptian phone input — auto-formats, validates 010 / 011 / 012 / 015, stores in E.164.
          </p>
        </header>

        {/* Interactive */}
        <section className="rounded-3xl border bg-card p-6 sm:p-8 shadow-sm">
          <PhoneInput
            value={value}
            onChange={(e164, meta) => {
              setValue(e164);
              setValid(meta.valid);
            }}
            label="Mobile number"
            required
          />
          <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl bg-muted/50 px-3 py-2">
              <div className="text-muted-foreground">Stored (E.164)</div>
              <div className="font-mono">{valid ? value : "—"}</div>
            </div>
            <div className="rounded-xl bg-muted/50 px-3 py-2">
              <div className="text-muted-foreground">Valid</div>
              <div className="font-mono">{String(valid)}</div>
            </div>
          </div>
        </section>

        {/* States */}
        <section className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-3xl border bg-card p-6">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Empty</p>
            <PhoneInput label="Phone" />
          </div>
          <div className="rounded-3xl border bg-card p-6">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Valid</p>
            <PhoneInput label="Phone" value="+201012345678" />
          </div>
          <div className="rounded-3xl border bg-card p-6">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Error</p>
            <ErrorPreview />
          </div>
          <div className="rounded-3xl border bg-card p-6">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Loading</p>
            <PhoneInput label="Phone" value="+201012345678" loading />
          </div>
          <div className="rounded-3xl border bg-card p-6">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Disabled</p>
            <PhoneInput label="Phone" value="+201012345678" disabled />
          </div>
          <div className="rounded-3xl border bg-card p-6">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Display + copy</p>
            <PhoneDisplay value="+201012345678" label="Primary contact" />
          </div>
        </section>
      </div>
    </div>
  );
}

function ErrorPreview() {
  // Pre-touched invalid state for demo
  const [v, setV] = React.useState("+2019");
  return <PhoneInput label="Phone" value={v} onChange={(e) => setV(e)} />;
}
