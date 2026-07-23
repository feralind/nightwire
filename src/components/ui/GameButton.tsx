"use client";

import { forwardRef } from "react";
import styles from "../ui/GameButton.module.css";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** primary = filled main · secondary = outline · danger = risk spend · ghost = alias of secondary */
  variant?: "primary" | "secondary" | "danger" | "ghost";
};

export const GameButton = forwardRef<HTMLButtonElement, Props>(function GameButton(
  { variant = "primary", className, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      className={[styles.btn, styles[variant], className].filter(Boolean).join(" ")}
      {...rest}
    />
  );
});
