import gsap from "gsap";

/** 动效必须读取系统偏好；减少动态时立刻切态，禁止位移和缩放。 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * 浮层只做透明度入场。
 * 不能写 transform：会覆盖 Radix / floating-ui 的定位，子菜单会掉回父菜单里。
 */
export function animateOverlayIn(element: HTMLElement): void {
  if (prefersReducedMotion()) {
    gsap.set(element, { opacity: 1 });
    return;
  }
  gsap.fromTo(element, { opacity: 0 }, { opacity: 1, duration: 0.16, ease: "power2.out" });
}

export function animateBackdropIn(element: HTMLElement): void {
  if (prefersReducedMotion()) {
    gsap.set(element, { opacity: 1 });
    return;
  }
  gsap.fromTo(element, { opacity: 0 }, { opacity: 1, duration: 0.16, ease: "power1.out" });
}

/** 右侧抽屉从屏幕外滑入。抽屉由 CSS 固定定位，可以使用 transform。 */
export function animateDrawerIn(element: HTMLElement): void {
  if (prefersReducedMotion()) {
    gsap.set(element, { xPercent: 0, opacity: 1 });
    return;
  }
  gsap.fromTo(
    element,
    { xPercent: 100, opacity: 1 },
    { xPercent: 0, duration: 0.24, ease: "power3.out" },
  );
}

export function animateThumb(element: HTMLElement, x: number, width: number): void {
  if (prefersReducedMotion()) {
    gsap.set(element, { x, width });
    return;
  }
  gsap.to(element, {
    x,
    width,
    duration: 0.28,
    ease: "power3.out",
  });
}
