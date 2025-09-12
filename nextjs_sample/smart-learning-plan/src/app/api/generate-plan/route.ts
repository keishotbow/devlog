import { createClient } from '@supabase/supabase-js';
import { verifyIdToken } from '@/lib/firebase/admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

/**
 * AIが生成したテキストからJSONオブジェクトを抽出するヘルパー関数
 * @param text - AIの応答テキスト
 * @returns - パースされたJSONオブジェクト
 */
function extractJson(text: string) {
    // ```json ... ``` というMarkdownブロック、または { ... } というオブジェクトを探す
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```|({[\s\S]*})/);
    if (!jsonMatch) {
        console.error("AI Response does not contain a valid JSON block:", text);
        throw new Error("AIが有効なJSONオブジェクトを返しませんでした。");
    }
    // マッチした部分（Markdownブロックの中身、またはオブジェクト全体）を取得
    const jsonString = jsonMatch[1] || jsonMatch[2];
    return JSON.parse(jsonString);
}

/**
 * 期間（月数）を計算するヘルパー関数
 * @param startDate - 開始日 (YYYY-MM-DD)
 * @param endDate - 終了日 (YYYY-MM-DD)
 * @returns - 期間の月数
 */
function getMonthDuration(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let months = (end.getFullYear() - start.getFullYear()) * 12;
    months -= start.getMonth();
    months += end.getMonth();
    return months <= 0 ? 1 : months + 1;
}

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
        const { isbn, planSettings } = await req.json();
        if (!isbn || !planSettings) {
            return NextResponse.json({ error: "ISBNと設定情報が必要です。" }, { status: 400 });
        }

        // 3. 書籍情報を取得 (openBD -> Google Books)
        let tableOfContents: string | null = null;
        let bookTitle: string = `ISBN: ${isbn}`;

        const openBdUrl = `https://api.openbd.jp/v1/get?isbn=${isbn}`;
        const openBdResponse = await fetch(openBdUrl);
        if (openBdResponse.ok) {
            const bookData = await openBdResponse.json();
            if (bookData && bookData[0] !== null) {
                const detail = bookData[0]?.onix?.CollateralDetail;
                const textContents = detail?.TextContent;
                const tocItem = Array.isArray(textContents) ? textContents.find((item: any) => item.TextType === "04") : undefined;
                if (tocItem?.Text) {
                    tableOfContents = tocItem.Text;
                    bookTitle = bookData[0]?.summary?.title || bookTitle;
                }
            }
        }

        if (!tableOfContents) {
            const googleBooksUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${process.env.GOOGLE_BOOKS_API_KEY}`;
            const googleBooksResponse = await fetch(googleBooksUrl);
            if (googleBooksResponse.ok) {
                const googleBooksData = await googleBooksResponse.json();
                if (googleBooksData.totalItems > 0 && googleBooksData.items[0].volumeInfo) {
                    const bookInfo = googleBooksData.items[0].volumeInfo;
                    tableOfContents = bookInfo.description || bookInfo.categories?.join(', ');
                    bookTitle = bookInfo.title || bookTitle;
                }
            }
        }

        if (!tableOfContents) {
            return NextResponse.json({ error: "書籍情報が見つからないか、計画生成に必要な目次や概要データがありませんでした。" }, { status: 404 });
        }

        // 4. Gemini APIで計画を月ごとに生成
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const totalMonths = getMonthDuration(planSettings.startDate, planSettings.endDate);
        const allWeeks: any[] = [];
        let previousContext = "";

        for (let i = 0; i < totalMonths; i++) {
            console.log(`Generating plan for month ${i + 1}...`);

            const prompt = `あなたはプロの教育コンサルタントです。これは${totalMonths}ヶ月学習計画の「${i + 1}ヶ月目」の計画です。
        #制約条件
        - 学習開始日: ${planSettings.startDate}
        - 目標達成日: ${planSettings.endDate}
        - 学習可能な曜日: ${planSettings.studyDays.join(', ')}
        - やる気レベル: ${planSettings.motivationLevel}
        - これは計画全体の${i + 1}ヶ月目です。
        ${previousContext}

        #書籍情報
        - タイトル: ${bookTitle}
        - 目次/概要: ${tableOfContents}
        
        #指示
        - **必ず1ヶ月分（約4週間）の計画だけを生成してください。**
        - 週番号は、計画全体を通して連番になるようにしてください。（例: 2ヶ月目ならWeek 5から始める）
        - 必ず以下のJSONスキーマに従って出力してください。コードブロックや説明文は不要です。
        { "weeks": [{ "weekNumber": ${i * 4 + 1}, "weeklyGoal": "...", "dailyTasks": [{ "day": "...", "tasks": [{"description": "...", "estimatedTime": 60, "isCompleted": false}] }] }] }
        `;

            const result = await model.generateContent(prompt);
            const responseText = result.response.text();

            let monthPlan;
            try {
                monthPlan = extractJson(responseText);
            } catch (e: any) {
                console.error(`Month ${i + 1} - JSON parse failed:`, responseText);
                throw new Error(`AIが${i + 1}ヶ月目の計画を不正な形式で生成しました。`);
            }

            allWeeks.push(...monthPlan.weeks);

            const lastWeek = monthPlan.weeks[monthPlan.weeks.length - 1];
            if (lastWeek) {
                previousContext = `前回の計画（${i + 1}ヶ月目）では、Week ${lastWeek.weekNumber}まで学習が進み、「${lastWeek.weeklyGoal}」を達成しました。この続きから計画を作成してください。`;
            }
        }

        const finalPlanData = { weeks: allWeeks };

        // 5. Supabaseに保存
        const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
        const { data, error } = await supabaseAdmin
            .from('plans')
            .insert([{
                user_id: uid,
                isbn,
                book_title: bookTitle,
                plan_settings: planSettings,
                plan_data: finalPlanData
            }])
            .select()
            .maybeSingle();

        if (error) throw error;

        // 6. 新しく作成された計画をフロントエンドに返す
        return NextResponse.json(data, { status: 200 });

    } catch (err: any) {
        console.error("Generate Plan Error:", err);
        return NextResponse.json({ error: err.message || "計画の生成に失敗しました。" }, { status: 500 });
    }
}