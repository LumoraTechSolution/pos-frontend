export default function PosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen w-full bg-black text-white selection:bg-primary/30">
      {children}
    </div>
  );
}
