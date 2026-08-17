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

/**
 * 登录页只在首次进入时建立层级：品牌、叙事、表单依次出现，但表单在半秒内即可操作。
 * 这里不依赖组件卸载来制造过渡，避免移动端软键盘或语言切换时重复播放整页动画。
 */
export function animateLoginEntrance(root: HTMLElement): () => void {
  const targets = {
    brand: root.querySelector<HTMLElement>("[data-motion='login-brand']"),
    story: root.querySelector<HTMLElement>("[data-motion='login-story']"),
    panel: root.querySelector<HTMLElement>("[data-motion='login-panel']"),
    controls: Array.from(root.querySelectorAll<HTMLElement>("[data-motion='login-control']")),
  };
  const allTargets = [targets.brand, targets.story, targets.panel, ...targets.controls].filter(
    (target): target is HTMLElement => Boolean(target),
  );

  if (prefersReducedMotion()) {
    gsap.set(allTargets, { clearProps: "all", opacity: 1, x: 0, y: 0, rotateY: 0 });
    return () => undefined;
  }

  const context = gsap.context(() => {
    const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });

    if (targets.brand) {
      timeline.fromTo(
        targets.brand,
        { opacity: 0, rotateY: -28, x: -12, transformPerspective: 700 },
        { opacity: 1, rotateY: 0, x: 0, duration: 0.5 },
        0,
      );
    }
    if (targets.story) {
      timeline.fromTo(
        targets.story,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.46 },
        0.08,
      );
    }
    if (targets.panel) {
      timeline.fromTo(
        targets.panel,
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, duration: 0.48 },
        0.06,
      );
    }
    if (targets.controls.length > 0) {
      timeline.fromTo(
        targets.controls,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.32, stagger: 0.035 },
        0.2,
      );
    }
  }, root);

  return () => context.revert();
}

/** 角色入口切换只刷新解释文案，避免整张表单晃动或让用户丢失输入焦点。 */
export function animatePortalDescription(element: HTMLElement): () => void {
  if (prefersReducedMotion()) {
    gsap.set(element, { clearProps: "all", opacity: 1, y: 0, rotateX: 0 });
    return () => undefined;
  }

  const tween = gsap.fromTo(
    element,
    { opacity: 0.35, y: -5, rotateX: -12, transformPerspective: 420 },
    { opacity: 1, y: 0, rotateX: 0, duration: 0.3, ease: "back.out(1.35)" },
  );
  return () => tween.revert();
}
