import { useRef, useEffect } from "react";
import { GameMode, NO_CANVAS_ERROR, CANVAS_HEIGHT, CANVAS_WIDTH, NO_CONTEXT_ERROR } from "./App";

interface useCanvasProps {
  gameMode: GameMode | null;
}

const useCanvas = ({ gameMode }: useCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D>(undefined);

  const shouldShowCanvas = gameMode !== undefined && gameMode !== null;

  useEffect(() => {
    if (!shouldShowCanvas) return;

    const canvas = canvasRef.current;
    if (!canvas) {
      console.error(NO_CANVAS_ERROR);
      return;
    }

    canvas.width = CANVAS_HEIGHT;
    canvas.height = CANVAS_WIDTH;

    const context = canvas.getContext("2d");
    if (!context) {
      console.error(NO_CONTEXT_ERROR);
      return;
    }

    context.lineCap = "round";
    context.strokeStyle = "black";
    context.lineWidth = 2;
    contextRef.current = context;
  }, [shouldShowCanvas]);

  return {
    canvasRef,
    contextRef,
    shouldShowCanvas
  };
};

export default useCanvas