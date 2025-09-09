import { useEffect, useState } from "react";

import { Dimensions, ScaledSize } from "react-native";

import { BREAKPOINTS } from "@/ui/styles/constants";

export type MediaSizeType = keyof typeof BREAKPOINTS;

const getMediaSize = (width: number): MediaSizeType => {
  if (width < BREAKPOINTS.sm) return "xs";
  if (width < BREAKPOINTS.md) return "sm";
  if (width < BREAKPOINTS.lg) return "md";
  if (width < BREAKPOINTS.xl) return "lg";
  return "xl";
};

/**
 * @todo Take into account that on server there is no screen size.
 * So the SSR response comes back mobile and this creates a "flash"
 * of content when the app loads on the client */
export function useMediaSize() {
  const [size, setSize] = useState<MediaSizeType>(() =>
    getMediaSize(Dimensions.get("window").width),
  );

  useEffect(() => {
    const onChange = ({
      window,
    }: {
      window: ScaledSize;
      screen: ScaledSize;
    }) => {
      setSize(getMediaSize(window.width));
    };

    const listener = Dimensions.addEventListener("change", onChange);

    return () => {
      listener.remove();
    };
  }, []);

  const currentSize = BREAKPOINTS[size];

  /**
   * Return if the current width is minimally the
   * request size (aka at least the requested size)
   *  */
  function isMin(requestSize: MediaSizeType) {
    const matchingWidth = BREAKPOINTS[requestSize];
    return currentSize >= matchingWidth;
  }
  function isMax(requestSize: MediaSizeType) {
    const matchingWidth = BREAKPOINTS[requestSize];
    return currentSize <= matchingWidth;
  }

  return { size, isMax, isMin };
}
