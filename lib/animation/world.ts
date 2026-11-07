import { Vector3 } from "three";
import { projects } from "@/data/projects";

/**
 * World layout: every scene lives at its own place in one continuous 3D space,
 * so transitions are real camera travel, never a cut.
 *
 *   z  0      intro logo (the camera flies through it)
 *   z -30     hero sculpture
 *   z -45…-115 manifesto shard field
 *   z -150…   one stage per project, 50 units apart
 *   …         capabilities track (runs along +x)
 *   …         lab, final logo
 */
export const WORLD = {
  logo: new Vector3(0, 0, 0),
  hero: new Vector3(0, 0, -30),
  manifesto: { from: -45, to: -118 },
  work: (i: number) => new Vector3(0, 0, -150 - i * 50),
  get caps() {
    return new Vector3(0, 0, -150 - projects.length * 50 - 20);
  },
  capsSpacing: 14,
  get lab() {
    return new Vector3(35, 6, this.caps.z - 40);
  },
  get final() {
    return new Vector3(0, 0, this.caps.z - 90);
  },
};

/** Laptop + phone layout relative to a project stage */
export const DEVICE = {
  screenW: 3.2,
  screenH: 2.0,
  /** lid open angle (radians, leaning back) */
  lidOpen: -0.15,
  hinge: new Vector3(0, 0.06, -1.1),
  lidH: 2.2,
  screenCenter: new Vector3(0, 1.154, -1.225),
  /** outward normal of the open screen */
  screenNormal: new Vector3(0, Math.sin(0.15), Math.cos(0.15)),
  phone: new Vector3(2.9, 0.15, 0.9),
  phoneW: 0.82,
  phoneH: 1.78,
};
