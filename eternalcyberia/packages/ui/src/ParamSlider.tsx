import { useId } from "react";

export interface ParamSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  /** Called on every input event. Callers coalesce before writing to the CRDT. */
  onChange: (v: number) => void;
  format?: (v: number) => string;
}

export function ParamSlider({ label, value, min, max, step = 1, onChange, format }: ParamSliderProps) {
  const id = useId();
  return (
    <div className="mb-4">
      <label htmlFor={id} className="flex justify-between font-mono text-[10px] uppercase tracking-[.1em] text-dim mb-2">
        <span>{label}</span>
        <b className="font-normal text-cyan">{format ? format(value) : value}</b>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="ec-range w-full h-[26px] bg-transparent"
      />
    </div>
  );
}
