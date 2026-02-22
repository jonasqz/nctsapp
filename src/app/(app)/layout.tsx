import { Sidebar } from "./sidebar";
import { CommandPalette } from "./command-palette";
import { Toaster } from "sonner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream">
      <Sidebar />
      <CommandPalette />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#ffffff",
            border: "1px solid #e8ecf1",
            color: "#0a0f1c",
          },
        }}
      />
      <main className="min-h-screen p-4 pt-16 md:ml-64 md:p-8 md:pt-8">
        {children}
      </main>
    </div>
  );
}
