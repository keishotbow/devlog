import { createBrowserClient } from '@supabase/ssr'

/**
 * これはブラウザ（フロントエンド）専用のSupabaseクライアントを作成するための関数です。
 * .env.localファイルからSupabaseのURLと公開キーを正しく読み込みます。
 */
export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    )
}