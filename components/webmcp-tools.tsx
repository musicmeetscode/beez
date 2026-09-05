"use client";
import { useEffect } from "react";

declare global {
  interface Document {
    modelContext?: {
      registerTool: (
        tool: {
          name: string;
          title?: string;
          description: string;
          inputSchema: Record<string, unknown>;
          annotations?: {
            readOnlyHint?: boolean;
            untrustedContentHint?: boolean;
          };
          execute: (input: unknown) => unknown | Promise<unknown>;
        },
        options?: { signal?: AbortSignal },
      ) => void | Promise<void>;
    };
  }
}

export function WebMCPTools() {
  useEffect(() => {
    if (!document.modelContext?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(
      document.modelContext.registerTool(
        {
          name: "start_invoice_creation",
          title: "Start a new invoice",
          description:
            "Open the same new-invoice form available in the Ledgerly header. This only starts the form and does not create a record.",
          inputSchema: {
            type: "object",
            properties: {},
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true, untrustedContentHint: false },
          execute() {
            const button = [
              ...document.querySelectorAll<HTMLButtonElement>("button"),
            ].find((node) => node.textContent?.includes("New invoice"));
            if (!button)
              throw new Error(
                "Sign in and select a business before starting an invoice.",
              );
            button.click();
            return { status: "invoice_form_opened" };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);
  return null;
}
