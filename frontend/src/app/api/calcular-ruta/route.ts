import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/calcular-ruta
 *
 * Proxy hacia el webhook de n8n para evitar bloqueos CORS en el navegador.
 * El frontend llama a este endpoint (mismo origen), y aquí se reenvía la
 * solicitud al servidor n8n (accesible sólo desde el servidor Next.js).
 */
export async function POST(req: NextRequest) {
  const webhookUrl =
    process.env.N8N_WEBHOOK_URL ??
    'https://n8n.frontieradvice.tech/webhook/calcular-ruta';

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Cuerpo de solicitud inválido' },
      { status: 400 }
    );
  }

  try {
    const upstream = await fetch(webhookUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
      // Timeout de 60 s para rutas largas
      signal:  AbortSignal.timeout(60_000),
    });

    const text = await upstream.text();

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `n8n respondió ${upstream.status}`, detail: text },
        { status: upstream.status }
      );
    }

    // Reenviar la respuesta de n8n tal cual al frontend
    return new NextResponse(text, {
      status:  200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Error de conexión con n8n';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
