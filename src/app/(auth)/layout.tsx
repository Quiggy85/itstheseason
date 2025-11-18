export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-white/60 bg-white/85 p-8 shadow-xl backdrop-blur">
        {children}
      </div>
    </div>
  );
}
