"use client";

import { useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/locale-provider";
import { saveWeeklySchedule } from "@/lib/actions/availability";

type Slot = { start: string; end: string };
type DaySchedule = { enabled: boolean; slots: Slot[] };

// 06:00 – 22:00 in 15-min steps
const TIME_OPTIONS: string[] = (() => {
  const opts: string[] = [];
  for (let h = 6; h <= 22; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === 22 && m > 0) break;
      opts.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return opts;
})();

// Display order: Mon(1) … Sat(6), Sun(0)
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

const DEFAULT_SLOT: Slot = { start: "09:00", end: "17:00" };

function initSchedule(
  ranges: { day_of_week: number; start_time: string; end_time: string }[],
): DaySchedule[] {
  return Array.from({ length: 7 }, (_, dayIndex) => {
    const dayRanges = ranges
      .filter((r) => r.day_of_week === dayIndex)
      .map((r) => ({ start: r.start_time.slice(0, 5), end: r.end_time.slice(0, 5) }))
      .sort((a, b) => a.start.localeCompare(b.start));
    return {
      enabled: dayRanges.length > 0,
      slots: dayRanges.length > 0 ? dayRanges : [{ ...DEFAULT_SLOT }],
    };
  });
}

function nextDefaultSlot(existingSlots: Slot[]): Slot {
  const last = existingSlots[existingSlots.length - 1];
  const base = last?.end ?? "09:00";
  const [hStr, mStr] = base.split(":");
  const totalMin = parseInt(hStr) * 60 + parseInt(mStr);
  const endMin = Math.min(totalMin + 120, 22 * 60);
  const eh = Math.floor(endMin / 60);
  const em = endMin % 60;
  const snappedEnd =
    TIME_OPTIONS.find((t) => t >= `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`) ?? "22:00";
  return { start: base, end: snappedEnd };
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)]/40"
      style={{ backgroundColor: checked ? "var(--brand-deep)" : "var(--academy-line)" }}
    >
      <span
        className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform"
        style={{ transform: checked ? "translateX(1.1rem)" : "translateX(0.125rem)" }}
      />
    </button>
  );
}

function TimeSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-[8px] border border-academy-line bg-white px-2 text-[13px] text-academy-navy focus:border-[color:var(--brand)]/60 focus:outline-none focus:ring-2 focus:ring-[color:var(--brand)]/15"
    >
      {TIME_OPTIONS.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function DayRow({
  dayLabel,
  day,
  onToggle,
  onAddSlot,
  onRemoveSlot,
  onUpdateSlot,
  addSlotLabel,
  offLabel,
}: {
  dayLabel: string;
  day: DaySchedule;
  onToggle: () => void;
  onAddSlot: () => void;
  onRemoveSlot: (si: number) => void;
  onUpdateSlot: (si: number, field: "start" | "end", val: string) => void;
  addSlotLabel: string;
  offLabel: string;
}) {
  return (
    <div className="flex items-start gap-4 py-3.5">
      <div className="flex w-32 shrink-0 items-center gap-2.5 pt-1">
        <Toggle checked={day.enabled} onChange={onToggle} />
        <span
          className="text-[13px] font-medium"
          style={{ color: day.enabled ? "var(--academy-navy)" : "var(--academy-slate)" }}
        >
          {dayLabel}
        </span>
      </div>

      {day.enabled ? (
        <div className="flex flex-1 flex-col gap-2">
          {day.slots.map((slot, si) => (
            <div key={si} className="flex flex-wrap items-center gap-2">
              <TimeSelect value={slot.start} onChange={(v) => onUpdateSlot(si, "start", v)} />
              <span className="text-[12px] text-academy-slate">–</span>
              <TimeSelect value={slot.end} onChange={(v) => onUpdateSlot(si, "end", v)} />
              {day.slots.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveSlot(si)}
                  className="flex h-8 w-8 items-center justify-center rounded-[6px] text-academy-slate-muted transition-colors hover:bg-[color:var(--academy-danger-soft)] hover:text-[color:var(--academy-danger)]"
                  aria-label="Remove slot"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
          {day.slots.length < 3 && (
            <button
              type="button"
              onClick={onAddSlot}
              className="flex w-fit items-center gap-1 text-[12px] font-medium text-[color:var(--brand-deep)] hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              {addSlotLabel}
            </button>
          )}
        </div>
      ) : (
        <span className="pt-1 text-[13px] text-academy-slate-muted">{offLabel}</span>
      )}
    </div>
  );
}

function SaveButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

export function WeeklyScheduleEditor({
  initialRanges,
}: {
  initialRanges: { day_of_week: number; start_time: string; end_time: string }[];
}) {
  const { dict } = useI18n();
  const t = dict.teacher.availability;
  const [schedule, setSchedule] = useState<DaySchedule[]>(() => initSchedule(initialRanges));
  const [state, action] = useActionState(saveWeeklySchedule, {});

  const schedulePayload = DAY_ORDER.filter(
    (d) => schedule[d].enabled && schedule[d].slots.length > 0,
  ).map((d) => ({ day: d, slots: schedule[d].slots }));

  function toggleDay(di: number) {
    setSchedule((prev) =>
      prev.map((d, i) =>
        i !== di
          ? d
          : { enabled: !d.enabled, slots: d.slots.length ? d.slots : [{ ...DEFAULT_SLOT }] },
      ),
    );
  }

  function addSlot(di: number) {
    setSchedule((prev) =>
      prev.map((d, i) =>
        i !== di ? d : { ...d, slots: [...d.slots, nextDefaultSlot(d.slots)] },
      ),
    );
  }

  function removeSlot(di: number, si: number) {
    setSchedule((prev) =>
      prev.map((d, i) => {
        if (i !== di) return d;
        const slots = d.slots.filter((_, idx) => idx !== si);
        return { slots: slots.length ? slots : [{ ...DEFAULT_SLOT }], enabled: slots.length > 0 };
      }),
    );
  }

  function updateSlot(di: number, si: number, field: "start" | "end", val: string) {
    setSchedule((prev) =>
      prev.map((d, i) =>
        i !== di
          ? d
          : { ...d, slots: d.slots.map((s, idx) => (idx !== si ? s : { ...s, [field]: val })) },
      ),
    );
  }

  return (
    <form action={action}>
      <input type="hidden" name="schedule" value={JSON.stringify(schedulePayload)} />

      {state.error && (
        <div className="mb-4 rounded-[10px] border border-[color:var(--academy-danger)]/25 bg-[color:var(--academy-danger-soft)] px-4 py-3 text-[13px] text-[color:var(--academy-danger)]">
          {state.error}
        </div>
      )}
      {state.saved && (
        <div className="mb-4 rounded-[10px] border border-[color:var(--academy-success)]/30 bg-[color:var(--academy-success)]/8 px-4 py-3 text-[13px] text-[color:var(--academy-success)]">
          {t.scheduleSaved}
        </div>
      )}

      <div className="divide-y divide-academy-line/60">
        {DAY_ORDER.map((dayIndex) => (
          <DayRow
            key={dayIndex}
            dayLabel={t.dayLabels[dayIndex]}
            day={schedule[dayIndex]}
            onToggle={() => toggleDay(dayIndex)}
            onAddSlot={() => addSlot(dayIndex)}
            onRemoveSlot={(si) => removeSlot(dayIndex, si)}
            onUpdateSlot={(si, field, val) => updateSlot(dayIndex, si, field, val)}
            addSlotLabel={t.addSlot}
            offLabel={t.dayOff}
          />
        ))}
      </div>

      <div className="mt-5">
        <SaveButton label={t.saveSchedule} pendingLabel={t.saving} />
      </div>
    </form>
  );
}
