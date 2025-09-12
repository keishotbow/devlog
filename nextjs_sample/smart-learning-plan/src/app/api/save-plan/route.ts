import { createClient } from '@supabase/supabase-js';
import { verifyIdToken } from '@/lib/firebase/admin';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        // 1. リクエストヘッダーから認証トークンを取得します
        const authorization = req.headers.get('Authorization');
        if (!authorization?.startsWith('Bearer ')) {
            return NextResponse.json({ error: '認証トークンがありません。' }, { status: 401 });
        }
        const token = authorization.split('Bearer ')[1];

        // 2. Firebase Admin SDKを使って、受け取ったトークンが本物か検証します
        const decodedToken = await verifyIdToken(token);
        const uid = decodedToken.uid; // 検証が成功すれば、FirebaseのユーザーIDが手に入ります

        // 3. フロントエンドから送られてきたリクエストの本体（ボディ）を取得します
        const { isbn, planText, bookTitle } = await req.json();

        if (!planText) {
            return NextResponse.json({ error: "計画のテキスト情報が不足しています。" }, { status: 400 });
        }

        // 4. SupabaseのAdminクライアントを作成します
        //    ここではRLS（行レベルセキュリティ）をバイパスできるサービスロールキーを使います
        //    なぜなら、ユーザーの本人確認はFirebase Admin SDKが既に行ったからです
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 5. 検証済みのユーザーIDを使って、データベースにデータを挿入します
        const { error } = await supabaseAdmin
            .from('plans')
            .insert([
                { user_id: uid, isbn, plan_text: planText, book_title: bookTitle },
            ]);

        if (error) {
            console.error("Supabase insert error:", error);
            return NextResponse.json({ error: "データベースへの保存に失敗しました。" }, { status: 500 });
        }

        // 6. 成功したことをフロントエンドに伝えます
        return NextResponse.json({ message: "保存に成功しました。" }, { status: 200 });

    } catch (err) {
        // トークンの検証に失敗した場合や、その他の予期せぬエラーはここで捕捉されます
        console.error("Authentication or Server Error:", err);
        return NextResponse.json({ error: "認証に失敗したか、サーバーでエラーが発生しました。" }, { status: 401 });
    }
}