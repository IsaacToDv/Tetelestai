declare module 'howler' {
  interface HowlOptions {
    src: string[];
    loop?: boolean;
    mute?: boolean;
    volume?: number;
    panningModel?: 'equalpower' | 'HRTF';
    distanceModel?: 'linear' | 'inverse' | 'exponential';
    refDistance?: number;
    maxDistance?: number;
    rolloffFactor?: number;
    onloaderror?: (id: number | null, reason: string | number) => void;
    onplayerror?: (id: number, reason: string) => void;
  }

  export class Howl {
    constructor(options: HowlOptions);
    play(spriteOrId?: string | number): number | null;
    mute(value: boolean): this;
    pos(x: number, y: number, z: number, id: number): this;
    off(): this;
    unload(): null;
  }

  export const Howler: {
    ctx: AudioContext | null;
    noAudio: boolean;
    usingWebAudio: boolean;
    volume(): number;
    pos(x: number, y: number, z: number): void;
    orientation(fx: number, fy: number, fz: number, ux: number, uy: number, uz: number): void;
  };
}
