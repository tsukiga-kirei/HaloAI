import gsap from "gsap";

/** 与 macOS 窗口展开相同的减速曲线：快起步，末端几乎停住。 */
const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";

const DURATION = {
  overlayIn: 0.22,
  thumb: 0.38,
  text: 0.4,
  panel: 0.36,
  section: 0.42,
  login: 0.62,
} as const;

/** 动效必须读取系统偏好；减少动态时立刻切态，禁止位移、缩放和模糊。 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function clearMotion(targets: gsap.TweenTarget): void {
  gsap.set(targets, { clearProps: "transform,filter,opacity,willChange" });
}

/**
 * 浮层只做透明度与轻微模糊。
 * 不能写 transform：会覆盖 Radix / floating-ui 的定位，子菜单会掉回父菜单里。
 */
export function animateOverlayIn(element: HTMLElement): void {
  gsap.killTweensOf(element);
  if (prefersReducedMotion()) {
    gsap.set(element, { autoAlpha: 1 });
    return;
  }
  gsap.fromTo(
    element,
    { autoAlpha: 0 },
    { autoAlpha: 1, duration: DURATION.overlayIn, ease: "power2.out" },
  );
}

export function animateBackdropIn(element: HTMLElement): void {
  gsap.killTweensOf(element);
  if (prefersReducedMotion()) {
    gsap.set(element, { opacity: 1 });
    return;
  }
  gsap.fromTo(element, { opacity: 0 }, { opacity: 1, duration: 0.32, ease: "power2.out" });
}

/**
 * 右侧抽屉只用 GPU 位移：一条时间线正向飞入、反向飞回。
 * 禁止对整板做 blur/scale——全高面板会掉帧，子节点错峰会看起来一卡一卡。
 */
export function createDrawerTimeline(
  content: HTMLElement,
  overlay: HTMLElement | null,
): gsap.core.Timeline {
  gsap.killTweensOf([content, overlay].filter(Boolean));
  const timeline = gsap.timeline({ paused: true });
  if (overlay) {
    timeline.fromTo(
      overlay,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.32, ease: "power2.out", immediateRender: true },
      0,
    );
  }
  timeline.fromTo(
    content,
    { xPercent: 100 },
    {
      xPercent: 0,
      duration: 0.52,
      ease: "expo.out",
      force3D: true,
      overwrite: true,
      immediateRender: true,
    },
    0,
  );
  return timeline;
}

export function showDrawerImmediate(content: HTMLElement, overlay: HTMLElement | null): void {
  gsap.set(content, { xPercent: 0 });
  if (overlay) gsap.set(overlay, { autoAlpha: 1 });
}

export function animateThumb(
  element: HTMLElement,
  x: number,
  width: number,
  options?: { immediate?: boolean },
): void {
  gsap.killTweensOf(element);
  if (prefersReducedMotion() || options?.immediate) {
    gsap.set(element, { x, width });
    return;
  }
  gsap.to(element, {
    x,
    width,
    duration: DURATION.thumb,
    ease: EASE_OUT,
    overwrite: true,
  });
}

/** 页签内容替换：短距上浮与去模糊，避免整块硬切。 */
export function animatePanelIn(element: HTMLElement): () => void {
  gsap.killTweensOf(element);
  if (prefersReducedMotion()) {
    clearMotion(element);
    gsap.set(element, { opacity: 1 });
    return () => undefined;
  }
  const tween = gsap.fromTo(
    element,
    { opacity: 0, y: 8, filter: "blur(6px)" },
    {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      duration: DURATION.panel,
      ease: EASE_OUT,
      onComplete: () => gsap.set(element, { clearProps: "filter" }),
    },
  );
  return () => tween.kill();
}

/**
 * 登录页只在首次进入时建立层级：品牌、叙事、表单依次出现，但表单在半秒内即可操作。
 * 不依赖卸载制造过渡，避免软键盘或语言切换时整页重播。
 */
export function animateLoginEntrance(root: HTMLElement): () => void {
  const targets = {
    brand: root.querySelector<HTMLElement>("[data-motion='login-brand']"),
    story: root.querySelector<HTMLElement>("[data-motion='login-story']"),
    panel: root.querySelector<HTMLElement>("[data-motion='login-panel']"),
    controls: Array.from(root.querySelectorAll<HTMLElement>("[data-motion='login-control']")),
  };
  const storyParts = targets.story
    ? Array.from(targets.story.querySelectorAll<HTMLElement>(":scope > *"))
    : [];
  const allTargets = [targets.brand, ...storyParts, targets.panel, ...targets.controls].filter(
    (target): target is HTMLElement => Boolean(target),
  );

  if (prefersReducedMotion()) {
    clearMotion(allTargets);
    gsap.set(allTargets, { opacity: 1 });
    return () => undefined;
  }

  const context = gsap.context(() => {
    const timeline = gsap.timeline({ defaults: { ease: EASE_OUT } });

    if (targets.brand) {
      timeline.fromTo(
        targets.brand,
        { opacity: 0, y: 12, scale: 0.94, filter: "blur(8px)" },
        { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.56 },
        0,
      );
    }
    if (targets.story) {
      gsap.set(targets.story, { opacity: 1 });
    }
    if (storyParts.length > 0) {
      timeline.fromTo(
        storyParts,
        { opacity: 0, y: 16, filter: "blur(8px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: DURATION.login,
          stagger: 0.07,
        },
        0.1,
      );
    }
    if (targets.panel) {
      timeline.fromTo(
        targets.panel,
        { opacity: 0, y: 18, scale: 0.97, filter: "blur(10px)" },
        { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.58 },
        0.08,
      );
    }
    if (targets.controls.length > 0) {
      timeline.fromTo(
        targets.controls,
        { opacity: 0, y: 10, filter: "blur(6px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.38,
          stagger: 0.045,
        },
        0.22,
      );
    }
  }, root);

  return () => context.revert();
}

/** 角色说明用去模糊显现，避免 3D 翻转抢走输入焦点。 */
export function animatePortalDescription(element: HTMLElement): () => void {
  gsap.killTweensOf(element);
  if (prefersReducedMotion()) {
    clearMotion(element);
    gsap.set(element, { opacity: 1 });
    return () => undefined;
  }
  const tween = gsap.fromTo(
    element,
    { opacity: 0, y: 6, filter: "blur(8px)" },
    {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      duration: DURATION.text,
      ease: EASE_OUT,
      onComplete: () => gsap.set(element, { clearProps: "filter" }),
    },
  );
  return () => tween.kill();
}

function collectSectionMotionTargets(root: HTMLElement): HTMLElement[] {
  const seen = new Set<HTMLElement>();
  const add = (node: HTMLElement | null) => {
    if (node) seen.add(node);
  };
  add(root.querySelector(".admin-section-heading"));
  root.querySelectorAll<HTMLElement>("[data-motion='admin-item']").forEach(add);
  add(root.querySelector(".admin-metrics"));
  add(root.querySelector(".organization-summary"));
  add(root.querySelector(".admin-overview-grid"));
  add(root.querySelector(".admin-security-grid"));
  add(root.querySelector(".system-health-grid"));
  return [...seen].slice(0, 10);
}

/**
 * 管理分区切换只做短距淡入与去模糊。数据表内部更新不会重播整页。
 */
export function animateManagementSection(element: HTMLElement): () => void {
  const targets = collectSectionMotionTargets(element);
  if (targets.length === 0) return () => undefined;
  gsap.killTweensOf(targets);
  if (prefersReducedMotion()) {
    clearMotion(targets);
    gsap.set(targets, { opacity: 1 });
    return () => undefined;
  }
  const context = gsap.context(() => {
    gsap.fromTo(
      targets,
      { opacity: 0, y: 8, filter: "blur(6px)" },
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: DURATION.section,
        stagger: 0.05,
        ease: EASE_OUT,
        onComplete: () => gsap.set(targets, { clearProps: "filter" }),
      },
    );
  }, element);
  return () => context.revert();
}
