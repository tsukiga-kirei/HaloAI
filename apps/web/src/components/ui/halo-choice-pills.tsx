"use client";

/**
 * 页内选项用药丸，不用下拉。移动端分区栏下方不允许再挂 select。
 */
export function HaloChoicePills({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
  ariaLabel: string;
}) {
  return (
    <div className="halo-choice-pills" role="radiogroup" aria-label={ariaLabel}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            type="button"
            role="radio"
            aria-checked={active}
            className={active ? "is-active" : ""}
            key={option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
