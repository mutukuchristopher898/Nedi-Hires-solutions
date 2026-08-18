export default function DemoTag({ inline = false }: { inline?: boolean }) {
  return (
    <span
      className={`rounded-full bg-amber/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber ${
        inline ? "ml-1 align-middle" : ""
      }`}
    >
      Illustrative Demo
    </span>
  );
}
