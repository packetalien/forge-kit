// Liquid Glass effect: full-screen quad with translucency (Tahoe-style)
// Phase 2: refraction/depth via uniforms can be added later

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
}

@vertex
fn vertex_main(@builtin(vertex_index) index: u32) -> VertexOutput {
  var out: VertexOutput;
  let x = f32((index << 1u) & 2u);
  let y = f32(index & 2u);
  out.position = vec4<f32>(x * 2.0 - 1.0, y * 2.0 - 1.0, 0.0, 1.0);
  out.uv = vec2<f32>(x, 1.0 - y);
  return out;
}

@fragment
fn fragment_main(in: VertexOutput) -> @location(0) vec4<f32> {
  // Translucent glass: slight tint, alpha for Tahoe vibrancy
  let glass = vec4<f32>(0.12, 0.14, 0.18, 0.85);
  return glass;
}
