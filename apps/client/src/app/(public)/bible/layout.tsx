export default function BibleLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  return (
    <div className="w-screen h-svh max-h-svh flex flex-col justify-center px-2 md:p-4 lg:p-8">
      {children}
    </div>
  );
}
