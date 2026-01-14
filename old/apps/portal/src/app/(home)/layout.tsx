export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="container mx-auto max-w-5xl space-y-6 px-4 py-6">
      {children}
    </main>
  );
}
