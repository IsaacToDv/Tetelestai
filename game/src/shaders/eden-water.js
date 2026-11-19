export const WATER_VERTEX_GLSL = /* glsl */ `
attribute vec3 vertex_position;
attribute vec2 vertex_texCoord0;
uniform mat4 matrix_model;
uniform mat4 matrix_viewProjection;
varying vec3 vWorldPosition;
varying vec2 vRiverUv;

void main(void) {
    vec4 worldPosition = matrix_model * vec4(vertex_position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vRiverUv = vertex_texCoord0;
    gl_Position = matrix_viewProjection * worldPosition;
}
`;

export const WATER_FRAGMENT_GLSL = /* glsl */ `
#include "fogPS"
#include "gammaPS"
#include "tonemappingPS"

uniform vec3 view_position;
uniform float uWaterPhase;
varying vec3 vWorldPosition;
varying vec2 vRiverUv;

void main(void) {
    float across = vRiverUv.x;
    float downstream = vRiverUv.y;
    float bankDistance = min(across, 1.0 - across);
    float depth = smoothstep(0.0, 0.43, bankDistance);
    vec3 viewDirection = normalize(view_position - vWorldPosition);

    // Move the fine ripples along each river's UVs, even as its course bends.
    float flow = sin(downstream * 3.1 + across * 10.0 - uWaterPhase * 3.0);
    float waveX = sin(dot(vWorldPosition.xz, vec2(2.4, 0.96)) - uWaterPhase * 2.0);
    float waveZ = sin(dot(vWorldPosition.xz, vec2(-0.74, 2.1)) + uWaterPhase);
    vec3 normal = normalize(vec3(waveX * 0.12 + flow * 0.045, 1.0, waveZ * 0.11 + flow * 0.06));
    float facing = clamp(abs(dot(normal, viewDirection)), 0.0, 1.0);
    float fresnel = 0.02 + 0.98 * pow(1.0 - facing, 5.0);

    vec3 reflectedRay = reflect(-viewDirection, normal);
    vec3 horizon = vec3(0.46, 0.60, 0.56);
    vec3 zenith = vec3(0.16, 0.32, 0.43);
    vec3 reflectedSky = mix(horizon, zenith, smoothstep(0.0, 0.76, reflectedRay.y));
    vec3 sunDirection = vec3(0.302, 0.669, 0.679);
    float sunlight = pow(max(dot(reflectedRay, sunDirection), 0.0), 54.0);
    float glint = sunlight * (0.16 + 0.24 * fresnel);

    vec3 waterColor = mix(vec3(0.08, 0.31, 0.25), vec3(0.017, 0.13, 0.17), depth);
    waterColor *= 1.0 + 0.16 * flow + 0.07 * waveX;
    vec3 color = mix(waterColor, reflectedSky, 0.12 + 0.83 * fresnel);
    color += vec3(1.0, 0.84, 0.62) * glint;

    float foamLine = 1.0 - smoothstep(0.015, 0.062, bankDistance);
    float foamPattern = 0.55 * sin(downstream * 7.0 - uWaterPhase * 2.0)
                      + 0.45 * sin(downstream * 13.0 + bankDistance * 58.0 - uWaterPhase * 4.0);
    float foam = foamLine * smoothstep(0.31, 0.82, foamPattern);
    color = mix(color, vec3(0.73, 0.84, 0.78), foam * 0.52);

    // Keep the shallow bed visible while the surface gains opacity at a grazing angle.
    float opacity = clamp(mix(0.32, 0.55, depth) + fresnel * 0.31 + foam * 0.15, 0.0, 0.92);
    gl_FragColor = vec4(gammaCorrectOutput(toneMap(addFog(color))), opacity);
}
`;
