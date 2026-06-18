/**
 * Drop-in shim for "motion/react".
 * Uses plain function components — no forwardRef, no React context.
 */
import { ReactNode } from "react";

// Props to strip from all motion elements
function strip(props: Record<string, any>) {
  const {
    initial, animate, exit, transition,
    whileTap, whileHover, whileFocus, whileDrag,
    variants, layout, layoutId,
    ...rest
  } = props;
  return rest;
}

function MotionDiv(props: any) {
  return <div {...strip(props)} />;
}

function MotionButton(props: any) {
  return <button {...strip(props)} />;
}

function MotionSpan(props: any) {
  return <span {...strip(props)} />;
}

function MotionImg(props: any) {
  return <img {...strip(props)} />;
}

export const motion = {
  div:    MotionDiv,
  button: MotionButton,
  span:   MotionSpan,
  img:    MotionImg,
};

export function AnimatePresence({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

export function useAnimation() {
  return { start: () => {}, stop: () => {}, set: () => {} };
}

export function useMotionValue(initial: number) {
  return { get: () => initial, set: () => {}, onChange: () => () => {} };
}
