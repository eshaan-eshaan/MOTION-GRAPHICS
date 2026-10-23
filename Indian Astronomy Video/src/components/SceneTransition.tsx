// Custom transition: the entering scene is revealed through a circle growing from a point
// (used where a scene grows out of a shared centre, e.g. the celestial pole).
import type React from "react";
import type { TransitionPresentation, TransitionPresentationComponentProps } from "@remotion/transitions";
import { AbsoluteFill, Easing } from "remotion";

type IrisProps = { x: number; y: number; maxR?: number };

const IrisPresentation: React.FC<TransitionPresentationComponentProps<IrisProps>> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}) => {
  if (presentationDirection === "exiting") {
    return <AbsoluteFill>{children}</AbsoluteFill>;
  }
  const p = Easing.bezier(0.65, 0, 0.35, 1)(presentationProgress);
  const r = (passedProps.maxR ?? 2300) * p;
  return (
    <AbsoluteFill style={{ clipPath: `circle(${r.toFixed(1)}px at ${passedProps.x}px ${passedProps.y}px)` }}>
      {children}
    </AbsoluteFill>
  );
};

export const iris = (props: IrisProps): TransitionPresentation<IrisProps> => ({
  component: IrisPresentation,
  props,
});
