import { AppNavbar } from "@/components/shared/app-navbar/navbar";

export default function ApplicationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <AppNavbar />

      <main className="flex-1 max-h-svh max-w-screen order-first md:order-0">
        {children}
      </main>
    </div>
  );
}
