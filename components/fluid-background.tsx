"use client";

import { useEffect, useRef, useState } from "react";

const FRAGMENT_SHADER = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_trail[30];
uniform int u_trail_length;

// Simplex noise implementation
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float fbm(vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 3; i++) {
        value += amplitude * snoise(st);
        st *= 1.5;
        amplitude *= 0.4;
    }
    return value;
}

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    st.x *= u_resolution.x / u_resolution.y;

    // Ambient scale
    st *= 0.6;

    // Time for ambient flow
    float t = u_time * 0.06;

    // Fluid distortion from noise - broad and smooth
    vec2 q = vec2(0.);
    q.x = fbm(st + t);
    q.y = fbm(st + vec2(1.0));

    vec2 r = vec2(0.);
    r.x = fbm(st + 1.0 * q + vec2(1.7, 9.2) + 0.15 * t);
    r.y = fbm(st + 1.0 * q + vec2(8.3, 2.8) + 0.126 * t);

    float f = fbm(st + r);

    // Trail intensity field
    float trail_intensity = 0.0;
    vec2 fluid_warp = vec2(0.0);
    
    for (int i = 0; i < 30; i++) {
        if (i >= u_trail_length) break;
        
        vec2 p = u_trail[i] / u_resolution.xy;
        p.x *= u_resolution.x / u_resolution.y;
        p *= 0.6; // Match st scale
        
        vec2 dir = st - p;
        float d = length(dir);
        
        float age = float(i) / float(30);
        
        // Moderately reduced radius (~10-15% tighter) as requested
        float radius = 0.035 + age * 0.055;
        float influence = smoothstep(radius, 0.0, d) * (1.0 - age);
        
        // Sharp ridges
        trail_intensity += influence * influence;
        
        // Magnetic stretching (viscous drag toward the trail)
        fluid_warp += dir * influence * 1.5;
    }

    // Apply distortion
    st += fluid_warp;
    
    // Recalculate noise with warped coordinates
    float warped_noise = fbm(st * 2.0 - fluid_warp * 3.0 + t * 2.0);
    
    // Interactive field merges intensity with noise to form ridges
    float final_field = trail_intensity * (0.2 + warped_noise * 1.3);
    
    // Dark Ferrofluid palette
    vec3 base_color = vec3(0.0, 0.0, 0.0); // AMOLED Black
    vec3 color1 = vec3(0.04, 0.0, 0.12);   // Deep Violet
    vec3 color2 = vec3(0.06, 0.15, 0.35);  // Dark Blue
    vec3 color3 = vec3(0.15, 0.4, 0.8);    // Electric Blue
    vec3 color4 = vec3(0.0, 0.85, 0.95);   // Cyan highlights

    vec3 final_color = base_color;
    
    // 1. AMBIENT FIELD (Velvety Liquid Metal Atmosphere)
    // Lowered mask bound (0.15) to allow a more continuous liquid presence across the background
    float ambient_mask = smoothstep(0.15, 0.85, f);
    
    // Calculate surface normal for soft sheen lighting
    float eps = 0.015;
    float dx = fbm(st + r + vec2(eps, 0.0)) - f;
    float dy = fbm(st + r + vec2(0.0, eps)) - f;
    vec3 normal = normalize(vec3(dx, dy, eps * 2.5)); // Z controls depth/flatness
    
    // Directional light from top-leftish
    vec3 light_dir = normalize(vec3(1.0, 1.0, 1.2));
    vec3 view_dir = vec3(0.0, 0.0, 1.0);
    vec3 half_vec = normalize(light_dir + view_dir);
    
    // Lighting terms
    float diffuse = max(dot(normal, light_dir), 0.0);
    // Low exponent (3.0) creates a broad, soft, silky reflection rather than hard glass specular
    float specular = pow(max(dot(normal, half_vec), 0.0), 3.0); 
    // Very subtle fresnel for velvet rim lighting
    float fresnel = pow(1.0 - max(dot(normal, view_dir), 0.0), 3.0);
    
    // Tonal gradients and depth variation (Slightly boosted diffuse/base for tonal separation)
    vec3 ambient_base = color1 * 0.75;                      // Deep Violet body
    vec3 ambient_diffuse = color2 * diffuse * 0.75;         // Dark Blue directional illumination
    vec3 ambient_sheen = color3 * specular * 0.2;           // Muted Electric Blue soft highlight
    vec3 ambient_rim = mix(color1, color2, 0.5) * fresnel * 0.3; // Faint edge glow
    
    // Combine lighting, constrained by the liquid presence mask
    vec3 ambient_layer = (ambient_base + ambient_diffuse + ambient_sheen + ambient_rim) * ambient_mask;
    final_color += ambient_layer;

    // 2. INTERACTIVE FIELD (Smaller, brighter, fast, deformable - UNTOUCHED)
    if (final_field > 0.02) {
        float t_mix = (final_field - 0.02) * 3.0;
        final_color = mix(final_color, color1, clamp(t_mix, 0.0, 1.0));
    }
    if (final_field > 0.2) {
        float t_mix = (final_field - 0.2) * 2.5;
        final_color = mix(color1, color2, clamp(t_mix, 0.0, 1.0));
    }
    if (final_field > 0.45) {
        float t_mix = (final_field - 0.45) * 3.0;
        final_color = mix(color2, color3, clamp(t_mix, 0.0, 1.0));
    }
    if (final_field > 0.75) {
        // Cyan highlights ONLY on absolute peaks/ridges
        float t_mix = (final_field - 0.75) * 4.0;
        final_color = mix(color3, color4, clamp(t_mix, 0.0, 1.0));
    }

    gl_FragColor = vec4(final_color, 1.0);
}
`;

const VERTEX_SHADER = `
attribute vec2 position;
void main() {
    gl_Position = vec4(position, 0.0, 1.0);
}
`;

export function FluidBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setIsReducedMotion(mql.matches);

    if (mql.matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false });
    if (!gl) return;

    // Compile shaders
    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Full screen quad
    const vertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1
    ]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const posAttrib = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(posAttrib);
    gl.vertexAttribPointer(posAttrib, 2, gl.FLOAT, false, 0, 0);

    // Uniforms
    const resUniform = gl.getUniformLocation(program, "u_resolution");
    const timeUniform = gl.getUniformLocation(program, "u_time");
    const trailUniform = gl.getUniformLocation(program, "u_trail");
    const trailLenUniform = gl.getUniformLocation(program, "u_trail_length");

    // State
    const TRAIL_LENGTH = 30;
    const trail = new Float32Array(TRAIL_LENGTH * 2);
    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let isActive = false;

    // Initialize trail offscreen or at center
    for (let i = 0; i < TRAIL_LENGTH; i++) {
      trail[i * 2] = pointerX;
      trail[i * 2 + 1] = pointerY;
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(resUniform, canvas.width, canvas.height);
    };
    window.addEventListener("resize", resize);
    resize();

    const handleMouseMove = (e: MouseEvent) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      pointerX = e.clientX * dpr;
      pointerY = canvas.height - (e.clientY * dpr);
      isActive = true;
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    let animationFrameId: number;
    let startTime = performance.now();

    const render = (time: number) => {
      const dt = (time - startTime) * 0.001;

      // Update trail physics - Fast, responsive, short trail
      const speed = 0.35;
      trail[0] += (pointerX - trail[0]) * speed;
      trail[1] += (pointerY - trail[1]) * speed;

      // Ripple effect through the trail - fast decay
      for (let i = 1; i < TRAIL_LENGTH; i++) {
        trail[i * 2] += (trail[(i - 1) * 2] - trail[i * 2]) * 0.45;
        trail[i * 2 + 1] += (trail[(i - 1) * 2 + 1] - trail[i * 2 + 1]) * 0.45;
      }

      gl.uniform1f(timeUniform, dt);
      gl.uniform2fv(trailUniform, trail);
      gl.uniform1i(trailLenUniform, TRAIL_LENGTH);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
    };
  }, []);

  if (isReducedMotion) {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-black">
        <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(30, 58, 138, 0.4) 0%, transparent 60%)' }} />
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0 bg-black"
      style={{ display: "block" }}
    />
  );
}
