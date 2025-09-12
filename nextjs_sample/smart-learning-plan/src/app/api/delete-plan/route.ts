import { createClient } from '@supabase/supabase-js';
import { verifyIdToken } from '@/lib/firebase/admin';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        const authorization = req.headers.get('Authorization');
        if (!authorization?.startsWith('Bearer ')) {
            return NextResponse.json({ error: '認証トークンがありません。' }, { status: 401 });
        }
        const token = authorization.split('Bearer ')[1];
        const decodedToken = await verifyIdToken(token);
        const uid = decodedToken.uid;

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SECRET_KEY!
        );

        const { data, error } = await supabaseAdmin
            .from('plans')
            .select('*')
            .eq('user_id', uid)
            .eq('is_archived', false) // アーカイブされていないものだけ取得
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        return NextResponse.json(data, { status: 200 });

    } catch (err: any) {
        console.error("Get Plans Error:", err);
        return NextResponse.json({ error: err.message || "計画の取得に失敗しました。" }, { status: 500 });
    }
}

