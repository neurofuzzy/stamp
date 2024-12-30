export class Easing {
  static FUNC_LINEAR = 0;
  static FUNC_QUAD = 1;
  static FUNC_CUBIC = 2;
  static FUNC_CIRCULAR = 3;
  static EASE_IN = 0;
  static EASE_OUT = 1;
  static EASE_IN_OUT = 2;

  static easeLinear(t: number): number {
    return t;
  }

  static easeInQuad(t: number): number {
    return t * t;
  }

  static easeOutQuad(t: number): number {
    return t * (2 - t);
  }

  static easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  static easeInCubic(t: number): number {
    return t * t * t;
  }

  static easeOutCubic(t: number): number {
    return --t * t * t + 1;
  }

  static easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  }

  static easeInCircular(t: number): number {
    return 1 - Math.sqrt(1 - t * t);
  }

  static easeOutCircular(t: number): number {
    return Math.sqrt(1 - --t * t);
  }

  static easeInOutCircular(t: number): number {
    return t < 0.5
      ? 0.5 * (1 - Math.sqrt(1 - 4 * t * t))
      : 0.5 * (Math.sqrt(1 - (-2 * t + 2) * (-2 * t + 2)) + 1);
  }

  private static _funcMap = [
    Easing.easeLinear,
    Easing.easeLinear,
    Easing.easeLinear,
    Easing.easeInQuad,
    Easing.easeOutQuad,
    Easing.easeInOutQuad,
    Easing.easeInCubic,
    Easing.easeOutCubic,
    Easing.easeInOutCubic,
    Easing.easeInCircular,
    Easing.easeOutCircular,
    Easing.easeInOutCircular,
  ];

  static ease(t: number, funcType: number, easeType: number): number {
    const idx = funcType * 3 + easeType;
    return Easing._funcMap[idx](t);
  }

  static interpolate(
    start: number,
    end: number,
    t: number,
    funcType: number,
    easeType: number,
  ): number {
    return start + (end - start) * Easing.ease(t, funcType, easeType);
  }
}
