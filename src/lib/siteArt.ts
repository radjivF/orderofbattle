/** Shared site art under /public/brand */

export const INDEX_BACKDROP_SRC = "/brand/index-backdrop.webp";

/**
 * Cover crop for the index battle art.
 * Must stay on an <img> / next/image — CSS background-attachment:fixed
 * over-zooms and jitters on iOS.
 */
export const INDEX_BACKDROP_ART_CLASS = "object-cover object-[center_58%]";
