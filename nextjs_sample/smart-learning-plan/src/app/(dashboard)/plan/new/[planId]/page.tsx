'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { Box, CircularProgress, Alert, Typography, Button, Tabs, Tab, Breadcrumbs } from '@mui/material';
import Link from 'next/link';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

// --- コンポーネントのインポート ---
import PlanSettings from '@/components/PlanSettings';
import PlanTaskList from '@/components/PlanTaskList';
import { createClient } from '@/lib/supabase/client';

// --- 型定義 ---
export type Task = { description: string; estimatedTime: number; isCompleted: boolean; };
export type DailyTask = { day: string; tasks: Task[]; };
export type WeeklyPlan = { weekNumber: number; weeklyGoal: string; dailyTasks: DailyTask[]; };
export type PlanData = { weeks: WeeklyPlan[]; };
export type PlanSettings = { startDate: string; endDate: string; studyDays: string[]; hoursPerWeekday: number; hoursPerWeekend: number; motivationLevel: number; };
export type Plan = { id: number; isbn: string; book_title: string; plan_settings: PlanSettings; plan_data: PlanData; };

export default function PlanDetailPage() {
    const router = useRouter();
    const params = useParams();
    const planId = params.planId;
    const supabase = createClient();

    // --- 状態管理 ---
    const [user, setUser] = useState<User | null>(null);
    const [activePlan, setActivePlan] = useState<Plan | null>(null);
    const [editableSettings, setEditableSettings] = useState<PlanSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState(0);

    // --- データ取得ロジック ---
    const fetchPlanDetails = useCallback(async (firebaseUser: User, id: string | string[]) => {
        setIsLoading(true);
        setError(null);
        try {
            const token = await firebaseUser.getIdToken();
            // バックエンドAPI経由でのデータ取得は、より安全なアーキテクチャです
            // ここではフロントエンドから直接取得していますが、将来的にはAPI経由を推奨します
            const { data, error } = await supabase
                .from('plans')
                .select('*')
                .eq('id', id)
                .eq('user_id', firebaseUser.uid)
                .single();

            if (error) throw error;

            setActivePlan(data);
            setEditableSettings(data.plan_settings);

        } catch (err: any) {
            setError("計画の読み込みに失敗しました。");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                if (planId) {
                    fetchPlanDetails(currentUser, planId);
                }
            } else {
                router.push('/login');
            }
        });
        return () => unsubscribe();
    }, [router, planId, fetchPlanDetails]);

    // --- イベントハンドラ ---
    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    const handleSettingsChange = (field: keyof PlanSettings, value: any) => {
        if (editableSettings) {
            setEditableSettings({ ...editableSettings, [field]: value });
        }
    };

    const handleSaveChanges = async () => {
        if (!user || !activePlan || !editableSettings) return;
        setIsSubmitting(true);
        setError(null);
        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/adjust-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    planId: activePlan.id,
                    updatedSettings: editableSettings,
                    currentPlanData: activePlan.plan_data,
                }),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error);
            }
            const updatedPlan = await response.json();
            setActivePlan(updatedPlan);
            setEditableSettings(updatedPlan.plan_settings);
            alert('計画設定を更新しました！');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTaskToggle = async (weekIndex: number, dayIndex: number, taskIndex: number) => {
        if (!activePlan || !user) return;

        const newActivePlan = JSON.parse(JSON.stringify(activePlan));
        const task = newActivePlan.plan_data.weeks[weekIndex].dailyTasks[dayIndex].tasks[taskIndex];
        task.isCompleted = !task.isCompleted;
        setActivePlan(newActivePlan);

        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/update-plan-progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    planId: activePlan.id,
                    updatedPlanData: newActivePlan.plan_data
                })
            });
            if (!response.ok) {
                throw new Error('進捗の保存に失敗しました。');
            }
        } catch (err) {
            console.error("Task update error:", err);
            setError("進捗の保存に失敗しました。");
            setActivePlan(activePlan); // エラーが発生したらUIを元に戻す
        }
    };

    const isSettingsChanged = useMemo(() => {
        if (!activePlan || !editableSettings) return false;
        return JSON.stringify(activePlan.plan_settings) !== JSON.stringify(editableSettings);
    }, [activePlan, editableSettings]);

    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 64px)' }}><CircularProgress /></Box>;
    }

    if (!activePlan) {
        return (
            <Box>
                <Typography>計画が見つかりません。</Typography>
                <Button component={Link} href="/">一覧に戻る</Button>
            </Box>
        );
    }

    return (
        <Box>
            <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb" sx={{ mb: 2 }}>
                <Link color="inherit" href="/">
                    計画一覧
                </Link>
                <Typography color="text.primary">{activePlan.book_title}</Typography>
            </Breadcrumbs>

            <Typography variant="h4" gutterBottom>{activePlan.book_title}</Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={activeTab} onChange={handleTabChange}>
                    <Tab label="計画ビュー" />
                    <Tab label="プラン設定" />
                </Tabs>
            </Box>

            <Box sx={{ pt: 3 }}>
                {activeTab === 0 && (
                    <PlanTaskList
                        planData={activePlan.plan_data}
                        onTaskToggle={handleTaskToggle}
                    />
                )}
                {activeTab === 1 && (
                    <PlanSettings
                        settings={editableSettings}
                        onSettingsChange={handleSettingsChange}
                        onSaveChanges={handleSaveChanges}
                        isChanged={isSettingsChanged}
                        isSubmitting={isSubmitting}
                    />
                )}
            </Box>
        </Box>
    );
}