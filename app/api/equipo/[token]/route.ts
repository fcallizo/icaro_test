import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

const PRIVATE_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0',
  Pragma: 'no-cache',
  'X-Content-Type-Options': 'nosniff',
};

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: PRIVATE_HEADERS },
  );
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) {
    return errorResponse(
      'Este enlace no es válido o ha sido revocado.',
      404,
    );
  }

  if (!sql) {
    return errorResponse(
      'La base de datos no está configurada.',
      503,
    );
  }

  const tokenHash = createHash('sha256')
    .update(token)
    .digest('hex');

  const [member] = await sql`
    SELECT id, name
    FROM event_members
    WHERE token_hash = ${tokenHash}
      AND revoked_at IS NULL
    LIMIT 1;
  `;

  if (!member) {
    return errorResponse(
      'Este enlace no es válido o ha sido revocado.',
      404,
    );
  }

  const events = await sql`
    SELECT
      e.id,
      e.type AS type,
      e.event_date AS date,
      e.status,
      COALESCE(w.name, p.name, 'Evento') AS "clientName",

      COALESCE((
        SELECT json_agg(
          other_member.name
          ORDER BY other_member.name
        )
        FROM event_assignments other_assignment
        JOIN event_members other_member
          ON other_member.id = other_assignment.member_id
        WHERE other_assignment.event_id = e.id
          AND other_assignment.member_id <> ${member.id}
          AND other_member.revoked_at IS NULL
      ), '[]'::json) AS colleagues,

      CASE
        WHEN w.event_id IS NOT NULL THEN
          jsonb_build_object(
            'groom_location', w.groom_location,
            'groom_departure_time', w.groom_departure_time,
            'bride_location', w.bride_location,
            'bride_departure_time', w.bride_departure_time,
            'ceremony_location', w.ceremony_location,
            'ceremony_time', w.ceremony_time,
            'location', w.location,
            'cocktail_time', w.cocktail_time,
            'open_bar_time', w.open_bar_time,
            'prewedding_date', (
              SELECT child.event_date
              FROM events child
              WHERE child.parent_event_id =
                COALESCE(e.parent_event_id, e.id)
                AND child.type = 'prewedding'
              LIMIT 1
            ),
            'prewedding_location', w.prewedding_location,
            'postwedding_date', (
              SELECT child.event_date
              FROM events child
              WHERE child.parent_event_id =
                COALESCE(e.parent_event_id, e.id)
                AND child.type = 'postwedding'
              LIMIT 1
            ),
            'postwedding_location', w.postwedding_location
          )

        WHEN p.event_id IS NOT NULL THEN
          jsonb_build_object(
            'location', p.location,
            'event_time', p.event_time,
            'camera_setup', p.camera_setup,
            'drone_setup', p.drone_setup,
            'lighting_setup', p.lighting_setup,
            'sound_setup', p.sound_setup,
            'logistics', p.logistics
          )

        ELSE '{}'::jsonb
      END AS details

    FROM event_assignments a

    JOIN events e
      ON e.id = a.event_id
      AND e.status = 'confirmed'

    LEFT JOIN wedding_requests w
      ON w.event_id = COALESCE(e.parent_event_id, e.id)
      AND e.type IN (
        'wedding',
        'prewedding',
        'postwedding'
      )

    LEFT JOIN production_requests p
      ON p.event_id = e.id
      AND e.type = 'production'

    WHERE a.member_id = ${member.id}

    ORDER BY e.event_date, e.type;
  `;

  return NextResponse.json(
    {
      memberName: member.name,
      events,
    },
    {
      headers: PRIVATE_HEADERS,
    },
  );
}
