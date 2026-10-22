import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const revalidate = 300;

type Resource = { public_id: string; secure_url: string; width: number; height: number; created_at?: string };
type CloudinaryResponse = { resources?: Resource[]; next_cursor?: string };

export async function GET(request: NextRequest) {
  const kind = request.nextUrl.searchParams.get('kind');
  const configuredFolder =
    kind === 'cinema'
      ? process.env.CLOUDINARY_CINEMA_FOLDER || 'Proyectos'
      : kind === 'wedding'
        ? process.env.CLOUDINARY_WEDDING_FOLDER || 'Bodas'
        : null;
  const normalizedFolder = configuredFolder?.replace(/^\/+|\/+$/g, '');
  const root = normalizedFolder
    ? normalizedFolder.includes('/')
      ? normalizedFolder
      : `Inicio/${normalizedFolder}`
    : null;
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;

  if (!root) return NextResponse.json({ error: 'Tipo de galería no válido.' }, { status: 400 });
  if (!cloud || !key || !secret) {
    return NextResponse.json({ error: 'Falta configurar Cloudinary en el servidor.' }, { status: 503 });
  }

  try {
    const all: Resource[] = [];
    let cursor: string | undefined;
    // Cloudinary Admin API: paginate through image assets under the configured folder prefix.
    for (let page = 0; page < 20; page++) {
      const url = new URL(`https://api.cloudinary.com/v1_1/${cloud}/resources/image/upload`);
      url.searchParams.set('prefix', `${root}/`);
      url.searchParams.set('max_results', '500');
      if (cursor) url.searchParams.set('next_cursor', cursor);
      const response = await fetch(url, {
        headers: { Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}` },
        next: { revalidate: 300 },
      });
      if (!response.ok) {
        const details = await response.text();
        console.error('Cloudinary Admin API error:', response.status, details);
        return NextResponse.json({ error: 'Cloudinary no ha permitido consultar los recursos. Comprueba los permisos de la API y las credenciales.' }, { status: 502 });
      }
      const data = (await response.json()) as CloudinaryResponse;
      all.push(...(data.resources ?? []));
      cursor = data.next_cursor;
      if (!cursor) break;
    }

    const projects = new Map<string, { name: string; cover: Resource; photos: Resource[] }>();
    for (const resource of all) {
      const remainder = resource.public_id.slice(root.length + 1);
      const slash = remainder.indexOf('/');
      if (slash < 1) continue; // Assets must live inside a project subfolder.
      const projectFolder = remainder.slice(0, slash);
      const current = projects.get(projectFolder);
      if (current) current.photos.push(resource);
      else projects.set(projectFolder, { name: projectFolder, cover: resource, photos: [resource] });
    }

    const result = Array.from(projects.values())
      .map((project) => ({
        id: project.name,
        name: project.name.replace(/[-_]+/g, ' ').replace(/^\d+\s*/, ''),
        cover: project.cover.secure_url,
        photos: project.photos
          .sort((a, b) => a.public_id.localeCompare(b.public_id, 'es', { numeric: true }))
          .map((photo) => ({ id: photo.public_id, src: photo.secure_url, width: photo.width, height: photo.height })),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es', { numeric: true }));

    return NextResponse.json({ projects: result }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (error) {
    console.error('Could not load Cloudinary works:', error);
    return NextResponse.json({ error: 'No se pudieron cargar los trabajos.' }, { status: 500 });
  }
}
