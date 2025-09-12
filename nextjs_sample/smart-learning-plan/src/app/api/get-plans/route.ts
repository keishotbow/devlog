import { createClient } from '@supabase/supabase-js';
import { verifyIdToken } from '@/lib/firebase/admin';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        // 1. ユーザー認証
        const authorization = req.headers.get('Authorization');
        if (!authorization?.startsWith('Bearer ')) {
            return NextResponse.json({ error: '認証トークンがありません。' }, { status: 401 });
        }
        const token = authorization.split('Bearer ')[1];
        const decodedToken = await verifyIdToken(token);
        const uid = decodedToken.uid;

        // 2. Supabase Adminクライアントを作成
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SECRET_KEY!
        );

        // 3. データベースから計画リストを取得
        const { data, error } = await supabaseAdmin
            .from('plans')
            .select('*')
            .eq('user_id', uid)
            .eq('is_archived', false) // アーカイブされていない計画のみを取得
            .order('created_at', { ascending: false }); // 作成日が新しい順に並べる

        if (error) {
            console.error("Supabase select error:", error);
            return NextResponse.json({ error: "データベースからの読み込みに失敗しました。" }, { status: 500 });
        }

        // 4. 取得したデータをフロントエンドに返す
        return NextResponse.json(data, { status: 200 });

    } catch (err: any) {
        console.error("Authentication or Server Error:", err);
        return NextResponse.json({ error: "認証に失敗したか、サーバーでエラーが発生しました。" }, { status: 401 });
    }
}