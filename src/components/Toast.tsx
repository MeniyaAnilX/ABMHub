export function Toast({
  message,
  type = "success",
}: {
  message: string;
  type?: "success" | "error";
}) {
  if (!message) return null;

  return (
    <div
      className={`fixed right-5 top-24 z-[100] rounded-2xl border px-5 py-4 text-sm font-bold  ${
        type === "error"
          ? "border-red-500/30 bg-red-500/15 text-red-100"
          : "border-emerald-500/30 bg-emerald-500/15 text-emerald-100"
      }`}
    >
      {message}
    </div>
  );
}
