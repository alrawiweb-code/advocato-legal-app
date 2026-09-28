"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";

export interface PasswordStrength {
  score: number; // 0–4
  label: "Too Short" | "Weak" | "Fair" | "Strong" | "Very Strong";
  color: string;
}

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password || password.length < 8) {
    return { score: 0, label: "Too Short", color: "bg-red-500" };
  }

  let score = 1; // base for meeting minimum length
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: "Weak", color: "bg-red-500" };
  if (score === 2) return { score: 2, label: "Fair", color: "bg-amber-500" };
  if (score === 3) return { score: 3, label: "Strong", color: "bg-emerald-500" };
  return { score: 4, label: "Very Strong", color: "bg-emerald-600" };
}

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  showStrength?: boolean;
  /** Override the inner <input> className entirely */
  inputClassName?: string;
}

export function PasswordInput({
  value,
  onChange,
  placeholder = "••••••••",
  required = false,
  minLength = 8,
  showStrength = false,
  inputClassName,
}: PasswordInputProps) {
  const [show, setShow] = useState(false);

  const strength = showStrength && value ? getPasswordStrength(value) : null;

  const defaultInputCls =
    "w-full pl-9 pr-10 py-2.5 rounded-xl border border-hairline bg-surface text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/50";

  return (
    <div className="space-y-1.5">
      <div className="relative">
        {/* Left lock icon */}
        <Lock className="w-4 h-4 text-on-surface-variant absolute left-3 top-3 pointer-events-none" />

        <input
          type={show ? "text" : "password"}
          required={required}
          minLength={minLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClassName ?? defaultInputCls}
        />

        {/* Right eye toggle */}
        <button
          type="button"
          onClick={() => setShow((prev) => !prev)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-3 top-2.5 text-on-surface-variant hover:text-primary transition-colors"
        >
          {show ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Strength meter */}
      {showStrength && value && strength && (
        <div className="space-y-1 pt-0.5">
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  i <= strength.score
                    ? strength.color
                    : "bg-surface-container-high"
                }`}
              />
            ))}
          </div>
          <span
            className={`text-[10px] font-semibold ${
              strength.score <= 1
                ? "text-red-600"
                : strength.score === 2
                ? "text-amber-600"
                : "text-emerald-600"
            }`}
          >
            {strength.label}
          </span>
        </div>
      )}
    </div>
  );
}
