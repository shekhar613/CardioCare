import { Box3, BufferGeometry, Mesh, Object3D, Vector3 } from "three";
import { anatomyFor, type AnatomyEntry } from "@/lib/anatomy";

export type HeartPart = {
  id: string;
  entry: AnatomyEntry;
  geometry: BufferGeometry;
  center: Vector3;
};

export type PreparedHeart = {
  parts: HeartPart[];
  scale: number;
  floorY: number;
};

export function prepareHeart(source: Object3D): PreparedHeart {
  source.updateMatrixWorld(true);

  const baked: { id: string; geometry: BufferGeometry }[] = [];
  source.traverse((object) => {
    const mesh = object as Mesh;
    if (!mesh.isMesh) return;
    const geometry = mesh.geometry.clone();
    geometry.applyMatrix4(mesh.matrixWorld);
    baked.push({ id: mesh.name, geometry });
  });

  const box = new Box3();
  baked.forEach((part, index) => {
    part.geometry.computeBoundingBox();
    const bounds = part.geometry.boundingBox;
    if (!bounds) return;
    if (index === 0) box.copy(bounds);
    else box.union(bounds);
  });

  const center = box.getCenter(new Vector3());
  const size = box.getSize(new Vector3());
  const scale = 1.9 / Math.max(size.x, size.y, size.z);

  const parts = baked.map((part) => {
    part.geometry.translate(-center.x, -center.y, -center.z);
    part.geometry.computeBoundingBox();
    const localCenter = part.geometry.boundingBox?.getCenter(new Vector3()) ?? new Vector3();
    return {
      id: part.id,
      entry: anatomyFor(part.id),
      geometry: part.geometry,
      center: localCenter,
    };
  });

  parts.sort((a, b) => a.entry.order - b.entry.order);

  return {
    parts,
    scale,
    floorY: (-size.y * scale) / 2 - 0.04,
  };
}
