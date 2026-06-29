export default function BibleLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  return <div className="w-full min-h-screen flex flex-col">{children}</div>;
}
