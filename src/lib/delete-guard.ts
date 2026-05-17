import { NextResponse } from 'next/server';

const DELETE_CONFIRM_TOKEN = process.env.DELETE_CONFIRM_TOKEN || 'sdxlab-delete-2026';

export function checkDeleteConfirmation(request: Request): NextResponse | null {
  const token = request.headers.get('x-delete-confirm');
  if (token !== DELETE_CONFIRM_TOKEN) {
    return NextResponse.json(
      { error: 'Delete confirmation required. Send header: x-delete-confirm' },
      { status: 403 }
    );
  }
  return null;
}
