/**
 * Decorative product chrome for the landing hero — not wired to live data.
 */
export function ProductPreview() {
  return (
    <div
      aria-hidden
      className="relative w-full overflow-hidden border-y border-teal-900/10 bg-[#0c1f24]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(45,212,191,0.18),transparent_50%),radial-gradient(ellipse_at_80%_100%,rgba(14,116,144,0.25),transparent_45%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative mx-auto grid max-w-6xl gap-4 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[220px_1fr] lg:gap-6 lg:py-12">
        <aside className="hidden flex-col gap-1 rounded-lg bg-white/[0.04] p-3 text-teal-50/80 lg:flex">
          <p className="mb-3 px-2 text-[11px] font-semibold tracking-[0.16em] text-teal-200/70 uppercase">
            Workspace
          </p>
          {[
            "Dashboard",
            "Appointments",
            "Patients",
            "Prescriptions",
            "Billing",
            "Video",
            "Reports",
          ].map((item, i) => (
            <div
              key={item}
              className={
                i === 1
                  ? "rounded-md bg-teal-400/15 px-3 py-2 text-sm font-medium text-teal-50"
                  : "rounded-md px-3 py-2 text-sm text-teal-100/55"
              }
            >
              {item}
            </div>
          ))}
        </aside>

        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.14em] text-teal-300/70 uppercase">
                Today · Demo Clinic
              </p>
              <p className="mt-1 text-lg font-semibold tracking-tight text-teal-50 sm:text-xl">
                Appointment board
              </p>
            </div>
            <div className="flex gap-2 text-xs text-teal-100/60">
              <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1">
                8 slots
              </span>
              <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1">
                3 open
              </span>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                time: "09:00",
                patient: "Pat Patient",
                type: "In-person",
                status: "Confirmed",
                accent: "bg-teal-400/20 text-teal-100",
              },
              {
                time: "10:30",
                patient: "Jordan Lee",
                type: "Video",
                status: "Waiting",
                accent: "bg-amber-400/15 text-amber-100",
              },
              {
                time: "11:15",
                patient: "Sam Rivera",
                type: "Follow-up",
                status: "Checked in",
                accent: "bg-sky-400/15 text-sky-100",
              },
              {
                time: "13:00",
                patient: "Open slot",
                type: "General",
                status: "Available",
                accent: "bg-white/5 text-teal-100/50",
              },
              {
                time: "14:45",
                patient: "Alex Chen",
                type: "Consult",
                status: "Confirmed",
                accent: "bg-teal-400/20 text-teal-100",
              },
              {
                time: "16:00",
                patient: "Open slot",
                type: "Telehealth",
                status: "Available",
                accent: "bg-white/5 text-teal-100/50",
              },
            ].map((row) => (
              <div
                key={row.time + row.patient}
                className="rounded-lg border border-white/10 bg-white/[0.04] p-3 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-teal-200/80">
                    {row.time}
                  </span>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${row.accent}`}
                  >
                    {row.status}
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium text-teal-50">
                  {row.patient}
                </p>
                <p className="mt-0.5 text-xs text-teal-100/45">{row.type}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
