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
      className={`fixed right-5 top-24 z-[100] rounded-2xl border px-5 py-4 text-sm font-extrabold shadow-2xl max-sm:left-4 max-sm:right-4 ${
        type === "error"
          ? "border-red-500/60 bg-[#2a080c] text-red-50 shadow-red-950/40"
          : "border-emerald-500/60 bg-[#052e1b] text-emerald-50 shadow-emerald-950/40"
      }`}
    >
      {message}
    </div>
  );
}
