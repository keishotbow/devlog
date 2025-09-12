import { createClient } from '@supabase/supabase-js';
import { verifyIdToken } from '@/lib/firebase/admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

function extractJson(text: string) {
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```|({[\s\S]*})/);
    if (!jsonMatch) {
        console.error("AI Response does not contain a valid JSON block:", text);
        throw new Error("AIが有効なJSONオブジェクトを返しませんでした。");
    }
    const jsonString = jsonMatch[1] || jsonMatch[2];
    return JSON.parse(jsonString);
}

// 残りの期間（月数）を計算するヘルパー関数
function getRemainingMonthDuration(startDateStr: string, endDateStr: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 時間をリセットして日付のみで比較

    const end = new Date(endDateStr);

    // 開始日が未来の場合は未来の日付を、過去の場合は今日を開始日と見なす
    const effectiveStart = new Date(startDateStr) > today ? new Date(startDateStr) : today;

    if (end < effectiveStart) return 1;

    let months = (end.getFullYear() - effectiveStart.getFullYear()) * 12;
    months -= effectiveStart.getMonth();
    months += end.getMonth();
    return months <= 0 ? 1 : months + 1;
}

export async function POST(req: Request) {
    try {
        const authorization = req.headers.get('Authorization');
        if (!authorization?.startsWith('Bearer ')) {
            return NextResponse.json({ error: '認証トークンがありません。' }, { status: 401 });
        }
        const token = authorization.split('Bearer ')[1];
        const decodedToken = await verifyIdToken(token);
        const uid = decodedToken.uid;

        const { planId, updatedSettings, currentPlanData } = await req.json();

        const uncompletedTasks = (currentPlanData.weeks || [])
            .flatMap((week: any) => week.dailyTasks || [])
            .flatMap((day: any) => day.tasks || [])
            .filter((task: any) => !task.isCompleted);

        const uncompletedTasksList = uncompletedTasks
            .map((task: any) => `- ${task.description} (目安: ${task.estimatedTime}分)`)
            .join('\n');

        const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);

        if (uncompletedTasks.length === 0) {
            const { data, error } = await supabaseAdmin.from('plans').update({ plan_settings: updatedSettings }).eq('id', planId).eq('user_id', uid).select().single();
            if (error) throw error;
            return NextResponse.json(data, { status: 200 });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // --- 分割リクエストのロジック ---
        const totalRemainingMonths = getRemainingMonthDuration(updatedSettings.startDate, updatedSettings.endDate);
        const allWeeks: any[] = [];
        let accumulatedTasks = uncompletedTasksList;
        let previousContext = `これは、残された未完了タスクを再分配する計画です。`;
        let startingWeekNumber = 1; // 常に1から再計画

        for (let i = 0; i < totalRemainingMonths; i++) {
            if (!accumulatedTasks) break; // 再分配するタスクがなくなったら終了

            console.log(`Re-generating plan for remaining month ${i + 1}...`);

            const prompt = `
            あなたは学習計画を修正するプロです。これは${totalRemainingMonths}ヶ月の再計画の「${i + 1}ヶ月目」の計画です。
            #現状
            - 再分配すべき未完了タスクのリスト:
            ${accumulatedTasks}
            - 現在の日付: ${new Date().toLocaleDateString()}
            ${previousContext}

            #新しい制約条件
            - 目標達成日: ${updatedSettings.endDate}
            - 学習可能な曜日: ${updatedSettings.studyDays.join(', ')}

            #指示
            - **「再分配すべき未完了タスクのリスト」から、この1ヶ月（約4週間）で実行可能な量のタスクだけを抜き出し、計画を立ててください。**
            - **タスクが割り振られなかった日は、dailyTasks配列に絶対に含めないでください。**
            - 週番号は、${startingWeekNumber}から始まる連番にしてください。
            - 必ず以下のJSONスキーマに従って出力してください。コードブロックや説明文は不要です。
            {
                "weeks": [ { "weekNumber": ${startingWeekNumber}, "weeklyGoal": "...", "dailyTasks": [{ "day": "...", "tasks": [...] }] } ],
                "remainingTasksForNextMonth": [/* この1ヶ月で計画に含めなかった残りのタスクの説明文を、文字列の配列としてここに入れてください */]
            }
        `;

            const result = await model.generateContent(prompt);
            const responseText = result.response.text();

            let monthPlan;
            try {
                monthPlan = extractJson(responseText);
            } catch (e: any) {
                console.error(`Month ${i + 1} - JSON parse failed:`, responseText);
                throw new Error(`AIが${i + 1}ヶ月目の再計画を不正な形式で生成しました。`);
            }

            if (monthPlan.weeks && monthPlan.weeks.length > 0) {
                allWeeks.push(...monthPlan.weeks);
                const lastWeek = monthPlan.weeks[monthPlan.weeks.length - 1];
                startingWeekNumber = (lastWeek.weekNumber || startingWeekNumber) + 1;
                previousContext = `前回のステップでは、Week ${lastWeek.weekNumber}までの計画を作成しました。この続きから計画を作成してください。`;
            }

            const remainingTasks = monthPlan.remainingTasksForNextMonth;
            if (!remainingTasks || remainingTasks.length === 0) {
                break;
            }
            accumulatedTasks = remainingTasks.join('\n');
        }
        // --- 分割リクエストここまで ---

        const newPlanData = { weeks: allWeeks };

        const { data, error } = await supabaseAdmin
            .from('plans')
            .update({ plan_settings: updatedSettings, plan_data: newPlanData })
            .eq('id', planId)
            .eq('user_id', uid)
            .select()
            .maybeSingle();

        if (error) throw error;

        return NextResponse.json(data, { status: 200 });

    } catch (err: any) {
        console.error("Adjust Plan Error:", err);
        return NextResponse.json({ error: err.message || "計画の修正に失敗しました。" }, { status: 500 });
    }
}