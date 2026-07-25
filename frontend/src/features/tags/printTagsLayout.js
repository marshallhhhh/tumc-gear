export const TAG_LAYOUTS = {
  sm: {
    label: "Small",
    widthMm: 15,
    heightMm: 28,
    gapMm: 6,
    pagePaddingMm: 10,
  },
  md: {
    label: "Small",
    widthMm: 35,
    heightMm: 35,
    gapMm: 7,
    pagePaddingMm: 10,
  },
  lg: {
    label: "Large",
    widthMm: 54,
    heightMm: 86,
    gapMm: 8,
    pagePaddingMm: 10,
  },
};

export function getTagLayoutForPage(tagSize, options = {}) {
  const { pageWidthMm = 210, pageHeightMm = 297 } = options;
  const config = TAG_LAYOUTS[tagSize] ?? TAG_LAYOUTS.sm;
  const usableWidthMm = Math.max(1, pageWidthMm - config.pagePaddingMm * 2);
  const usableHeightMm = Math.max(1, pageHeightMm - config.pagePaddingMm * 2);
  const columns = Math.max(
    1,
    Math.floor(
      (usableWidthMm + config.gapMm) / (config.widthMm + config.gapMm),
    ),
  );
  const rows = Math.max(
    1,
    Math.floor(
      (usableHeightMm + config.gapMm) / (config.heightMm + config.gapMm),
    ),
  );

  return {
    ...config,
    columns,
    rows,
    tagsPerPage: columns * rows,
    usableWidthMm,
    usableHeightMm,
  };
}
