"use client";

import { useState } from "react";

/**
 * A password box with a Show / Hide button, so people can check what they
 * typed (most mistakes at sign in are typos, especially on a phone). Accepts
 * the same props as an <input>; pass autoComplete="current-password" on sign
 * in and "new-password" when choosing one, so password managers and phones
 * fill and save it correctly.
 */
export default function PasswordInput(props: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visible, setVisible] = useState(false);
  const { className, ...rest } = props;

  return (
    <div className="relative">
      <input
        {...rest}
        type={visible ? "text" : "password"}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className={`${className ?? ""} pr-16`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-pressed={visible}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 mt-1 px-3 text-xs font-semibold text-midnight/60 hover:text-midnight focus-visible:outline-2 focus-visible:outline-gold"
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}
