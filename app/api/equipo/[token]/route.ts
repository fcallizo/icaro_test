import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { ensureTables, sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } },
) {
  const token = params.token;
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) {
    return NextResponse.json({ error: 'Este enlace no es válido o ha sido revocado.' }, { status: 404 });
  }
  if (!sql) {
    return NextResponse.json({ error: 'La base de datos no está configurada.' }, { status: 503 });
  }

  await ensureTables();
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const [member] = await sql`
    SELECT id, name FROM team_members
    WHERE token_hash = ${tokenHash} AND revoked_at IS NULL
    LIMIT 1;
  `;
  if (!member) {
    return NextResponse.json({ error: 'Este enlace no es válido o ha sido revocado.' }, { status: 404 });
  }

  const events = await sql`
    SELECT e.id, e.tipo AS type, e.fecha AS date, e.status,
      COALESCE(w.nombre, p.nombre, 'Evento') AS "clientName",
      COALESCE((
        SELECT json_agg(other_member.name ORDER BY other_member.name)
        FROM event_assignments other_assignment
        JOIN team_members other_member ON other_member.id = other_assignment.member_id
        WHERE other_assignment.event_id = e.id
          AND other_assignment.member_id <> ${member.id}
          AND other_member.revoked_at IS NULL
      ), '[]'::json) AS colleagues,
      CASE
        WHEN w.evento_id IS NOT NULL THEN
          (to_jsonb(w) - 'id' - 'evento_id' - 'created_at' - 'customer_form_token_hash')
          || jsonb_build_object(
            'fecha_preboda', (
              SELECT child.fecha FROM eventos child
              WHERE child.parent_event_id = COALESCE(e.parent_event_id, e.id)
                AND child.tipo = 'prewedding'
            ),
            'fecha_postboda', (
              SELECT child.fecha FROM eventos child
              WHERE child.parent_event_id = COALESCE(e.parent_event_id, e.id)
                AND child.tipo = 'postwedding'
            )
          )
        WHEN p.evento_id IS NOT NULL THEN
          to_jsonb(p) - 'id' - 'evento_id' - 'created_at'
        ELSE '{}'::jsonb
      END AS details
    FROM event_assignments a
    JOIN eventos e ON e.id = a.event_id AND e.status = 'confirmed'
    LEFT JOIN wedding_requests w
      ON w.evento_id = COALESCE(e.parent_event_id, e.id)
      AND e.tipo IN ('wedding', 'prewedding', 'postwedding')
    LEFT JOIN production_requests p
      ON p.evento_id = e.id AND e.tipo = 'production'
    WHERE a.member_id = ${member.id}
    ORDER BY e.fecha, e.tipo;
  `;

  return NextResponse.json(
    { memberName: member.name, events },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
