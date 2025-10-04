"use client";
import { useEffect, useMemo, useState } from "react";
import {
  loadCustomGPAScale,
  saveCustomGPAScale,
  resetCustomGPAScale,
  GPAScaleEntry,
  loadCustomGradeBounds,
  saveCustomGradeBounds,
  resetCustomGradeBounds,
  GradeBound,
  loadCalculateGradesEnabled,
  saveCalculateGradesEnabled,
  resetCalculateGradesEnabled,
} from "@/utils/gradebook";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

const ORDER = ["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "F"];

export default function SettingsPage() {
  const [entries, setEntries] = useState<GPAScaleEntry[]>([]);
  const [bounds, setBounds] = useState<GradeBound[]>([]);
  const [dirty, setDirty] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [calcGrades, setCalcGrades] = useState(false);

  useEffect(() => {
    const scale = loadCustomGPAScale();
    setEntries(ORDER.map((letter) => ({ letter, value: scale[letter] })));
    setBounds(loadCustomGradeBounds());
    setCalcGrades(loadCalculateGradesEnabled());
  }, []);

  const updateValue = (letter: string, val: string) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.letter === letter ? { ...e, value: Number(val) || 0 } : e,
      ),
    );
    setDirty(true);
    setSavedMsg(null);
  };

  const updateBound = (letter: string, val: string) => {
    const num = Number(val);
    setBounds((prev) =>
      prev.map((b) =>
        b.letter === letter ? { ...b, min: isNaN(num) ? b.min : num } : b,
      ),
    );
    setDirty(true);
    setSavedMsg(null);
  };

  const validationErrors = useMemo(() => {
    const errs: string[] = [];
    for (const e of entries) {
      if (e.value < 0 || e.value > 5) {
        errs.push(`${e.letter} GPA must be between 0 and 5`);
      }
      if (!Number.isFinite(e.value)) {
        errs.push(`${e.letter} GPA must be a number`);
      }
    }
    const orderedBounds = ORDER.map(
      (letter) => bounds.find((b) => b.letter === letter) || { letter, min: 0 },
    );
    for (const b of orderedBounds) {
      if (b.min < 0 || b.min > 100 || !Number.isFinite(b.min)) {
        errs.push(`${b.letter} min% must be between 0 and 100`);
      }
    }
    for (let i = 0; i < orderedBounds.length - 1; i++) {
      const current = orderedBounds[i];
      const next = orderedBounds[i + 1];
      if (current.min < next.min) {
        errs.push(`Min % for ${current.letter} should be >= ${next.letter}`);
      }
      if (current.min === next.min) {
        errs.push(
          `Min % for ${current.letter} must be greater than ${next.letter}`,
        );
      }
    }
    const f = orderedBounds.find((b) => b.letter === "F");
    if (!f) errs.push("F grade bound missing");
    return errs;
  }, [entries, bounds]);

  const handleSaveAll = () => {
    if (validationErrors.length) {
      setShowErrors(true);
      return;
    }
    saveCustomGPAScale(entries);
    const sanitized = bounds
      .filter((b) => b.letter)
      .map((b) => ({ ...b, min: Math.max(0, Math.min(100, b.min)) }))
      .sort((a, b) => b.min - a.min);
    saveCustomGradeBounds(sanitized);
    setBounds(sanitized);
    saveCalculateGradesEnabled(calcGrades);
    setDirty(false);
    setSavedMsg("Saved");
    setTimeout(() => setSavedMsg(null), 1500);
  };

  const handleResetAll = () => {
    resetCustomGPAScale();
    resetCustomGradeBounds();
    resetCalculateGradesEnabled();
    const scale = loadCustomGPAScale();
    setEntries(ORDER.map((letter) => ({ letter, value: scale[letter] })));
    setBounds(loadCustomGradeBounds());
    setCalcGrades(loadCalculateGradesEnabled());
    setDirty(false);
    setSavedMsg("Reset to default");
    setTimeout(() => setSavedMsg(null), 1500);
  };

  const isInvalidLetter = (letter: string): boolean => {
    return (
      validationErrors.some((e) => e.startsWith(letter + " ")) ||
      validationErrors.some((e) => e.includes(" " + letter))
    );
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <p className="text-xl font-medium pb-3">Settings</p>
        <p className="text-sm text-gray-500">
          Customize your student experience.
        </p>
      </div>
      <section className="space-y-4">
        <header>
          <h2 className="text-lg font-medium">Grades & GPA Configuration</h2>
          <p className="text-xs text-gray-500">
            Edit thresholds based on your schools grading policy
          </p>
        </header>
        <div className="pl-5 pt-1">
        <div className="flex items-start rounded">
          <Checkbox
            id="calc-grades"
            checked={calcGrades}
            onCheckedChange={(checked) => {
              const isChecked = checked === true;
              setCalcGrades(isChecked);
              setDirty(true);
              setSavedMsg(null);
            }}
          />
          <div className="w-5" />
          <label htmlFor="calc-grades" className="text-sm leading-tight cursor-pointer select-none">
            <span className="font-medium">Calculate Grades</span>
            <br />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              When enabled, grades are recomputed locally using assignments and your custom bounds instead of accepting the portal&apos;s reported mark. This may be less accurate if your school uses hidden or excluded assignments, complex weighting, or other rules. GPA points are always calculated locally.
            </span>
          </label>
        </div>
        <div className="h-3"/>
        <Table className="min-w-[520px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Letter</TableHead>
              <TableHead className="w-40">GPA Points</TableHead>
              <TableHead className="w-40">Min % (inclusive)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ORDER.map((letter) => {
              const entry = entries.find((e) => e.letter === letter);
              const bound = bounds.find((b) => b.letter === letter) || {
                letter,
                min: 0,
              };
              return (
                <TableRow
                  key={letter}
                  className={isInvalidLetter(letter) ? "bg-red-50/60" : ""}
                >
                  <TableCell className="font-medium">{letter}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.1"
                      min={0}
                      max={5}
                      value={entry?.value ?? 0}
                      onChange={(ev) => updateValue(letter, ev.target.value)}
                      className={`w-28 h-8 ${entry && (entry.value < 0 || entry.value > 5 || !Number.isFinite(entry.value)) ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step="0.1"
                      value={bound.min}
                      onChange={(ev) => updateBound(letter, ev.target.value)}
                      className={`w-28 h-8 ${bound.min < 0 || bound.min > 100 || !Number.isFinite(bound.min) ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {showErrors && validationErrors.length > 0 && (
          <div className="text-sm text-red-600 space-y-1 border border-red-300 rounded p-2 bg-red-50">
            {validationErrors.map((e, i) => (
              <div key={i}>• {e}</div>
            ))}
          </div>
        )}
        </div>
        <div className="flex gap-3 items-center">
          <Button
            disabled={!dirty || validationErrors.length > 0}
            onClick={handleSaveAll}
            variant={dirty && !validationErrors.length ? "default" : "outline"}
          >
            Save All
          </Button>
          <Button type="button" variant="outline" onClick={handleResetAll}>
            Reset to Default
          </Button>
          {savedMsg && (
            <span className="text-xs text-gray-500">{savedMsg}</span>
          )}
        </div>
      </section>
      {savedMsg && !dirty && (
        <div className="text-xs text-gray-500 pt-2">{savedMsg}</div>
      )}
    </div>
  );
}
