import { useRef, useState, useEffect, type ReactNode } from 'react';

/**
 * Only mounts children (typically a <Canvas>) when the container is
 * within `rootMargin` of the viewport. Unmounts when scrolled away,
 * freeing the WebGL context.
 */
export function ViewportCanvas({
  children,
  className = '',
  style,
  fallback,
  rootMargin = '200px',
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  fallback?: ReactNode;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref} className={className} style={style}>
      {inView ? children : (fallback ?? null)}
    </div>
  );
}
