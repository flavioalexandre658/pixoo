import { useCallback, useEffect, useRef, useState } from "react";

interface UseInfiniteScrollOptions {
  threshold?: number; // Distância do final da página para disparar o carregamento (em pixels)
  rootMargin?: string; // Margem do observer
}

interface UseInfiniteScrollReturn {
  isFetching: boolean;
  setIsFetching: (fetching: boolean) => void;
  lastElementRef: (node: HTMLElement | null) => void;
}

export const useInfiniteScroll = (
  hasMore: boolean,
  fetchMore: () => void,
  options: UseInfiniteScrollOptions = {}
): UseInfiniteScrollReturn => {
  const { threshold = 100, rootMargin = "0px" } = options;
  const [isFetching, setIsFetching] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);

  const lastElementRef = useCallback(
    (node: HTMLElement | null) => {
      if (isFetching) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !isFetching) {
            setIsFetching(true);
            fetchMore();
          }
        },
        {
          rootMargin,
          threshold: 0.1,
        }
      );

      if (node) observer.current.observe(node);
    },
    [isFetching, hasMore, fetchMore, rootMargin]
  );

  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  return { isFetching, setIsFetching, lastElementRef };
};
