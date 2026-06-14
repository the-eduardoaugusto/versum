import { AppNavbar } from "@/components/shared/app-navbar/navbar";

export default function ApplicationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <AppNavbar />

      <main className="flex-1 overflow-y-auto max-w-screen order-first md:order-none pb-[58px] md:pb-0">
        {children}
      </main>
    </div>
  );
}
