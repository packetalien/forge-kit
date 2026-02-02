// WebGPU WGSL placeholder for Liquid Glass / Tahoe effects
// Phase 2: implement grid and UI shaders

@vertex
fn vs_main() -> @builtin(position) vec4<f32> {
  return vec4<f32>(0.0, 0.0, 0.0, 1.0);
}

@fragment
fn fs_main() -> @location(0) vec4<f32> {
  return vec4<f32>(0.1, 0.1, 0.15, 1.0);
}
