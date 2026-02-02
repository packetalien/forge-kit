import { useEffect, useRef } from 'react';
import type { Container } from '@shared/types';
import liquidGlassWgsl from '../shaders/liquidGlass.wgsl?raw';

interface InventoryCanvasProps {
  container: Container;
  className?: string;
}

declare global {
  interface Navigator {
    gpu?: GPU;
  }
}

export function InventoryCanvas({ container, className = '' }: InventoryCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !navigator.gpu) return;

    let device: GPUDevice | null = null;
    let pipeline: GPURenderPipeline | null = null;

    (async () => {
      try {
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) return;
        device = await adapter.requestDevice();
        const context = canvas.getContext('webgpu');
        if (!context) return;

        const format = navigator.gpu.getPreferredCanvasFormat();
        context.configure({
          device,
          format,
          alphaMode: 'premultiplied',
        });

        const module = device.createShaderModule({ code: liquidGlassWgsl });
        pipeline = await device.createRenderPipelineAsync({
          layout: 'auto',
          vertex: {
            module,
            entryPoint: 'vertex_main',
          },
          fragment: {
            module,
            entryPoint: 'fragment_main',
            targets: [{ format }],
          },
          primitive: { topology: 'triangle-list' },
        });

        function render() {
          if (!context || !device || !pipeline) return;
          const texture = context.getCurrentTexture();
          const encoder = device.createCommandEncoder();
          const pass = encoder.beginRenderPass({
            colorAttachments: [
              {
                view: texture.createView(),
                loadOp: 'clear',
                storeOp: 'store',
                clearValue: { r: 0.08, g: 0.09, b: 0.12, a: 0.9 },
              },
            ],
          });
          pass.setPipeline(pipeline);
          pass.draw(6, 1, 0, 0);
          pass.end();
          device.queue.submit([encoder.finish()]);
          frameRef.current = requestAnimationFrame(render);
        }
        render();
      } catch {
        // WebGPU not available or init failed
      }
    })();

    return () => {
      cancelAnimationFrame(frameRef.current);
      device?.destroy();
    };
  }, [container.id]);

  return (
    <canvas
      ref={canvasRef}
      width={container.gridWidth * 32}
      height={container.gridHeight * 32}
      className={className}
      style={{ width: '100%', height: 'auto', display: 'block' }}
    />
  );
}
