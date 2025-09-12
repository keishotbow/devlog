import { createClient } from '@supabase/supabase-js';
import { verifyIdToken } from '@/lib/firebase/admin';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        // 1. ユーザー認証
        const authorization = req.headers.get('Authorization');
        if (!authorization?.startsWith('Bearer ')) {
            return NextResponse.json({ error: '認証トークンがありません。' }, { status: 401 });
        }
        const token = authorization.split('Bearer ')[1];
        const decodedToken = await verifyIdToken(token);
        const uid = decodedToken.uid;

        // 2. フロントエンドからデータを受け取る
        const { planId, updatedPlanData } = await req.json();

        if (!planId || !updatedPlanData) {
            return NextResponse.json({ error: "必要な情報が不足しています。" }, { status: 400 });
        }

        // 3. Supabase Adminクライアントを作成
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SECRET_KEY!
        );

        // 4. データベースを更新
        //    planIdとuser_idの両方が一致する行のplan_data列のみを更新する
        const { data, error } = await supabaseAdmin
            .from('plans')
            .update({ plan_data: updatedPlanData })
            .eq('id', planId)
            .eq('user_id', uid) // 本人しか更新できないようにするセキュリティ対策
            .select()
            .single();

        if (error) {
            console.error("Supabase update error:", error);
            return NextResponse.json({ error: "データベースの更新に失敗しました。" }, { status: 500 });
        }

        return NextResponse.json(data, { status: 200 });

    } catch (err) {
        console.error("Authentication or Server Error:", err);
        return NextResponse.json({ error: "認証に失敗したか、サーバーでエラーが発生しました。" }, { status: 500 });
    }
}

