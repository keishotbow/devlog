'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { Box, CircularProgress, Alert, Typography } from '@mui/material';

import NewPlanForm from '@/components/NewPlanForm';
import type { PlanSettings } from '../[planId]/page';

const today_JST = () => new Date(new Date().getTime() + 9 * 60 * 60 * 1000).toISOString().split('T')[0];

const defaultSettings: PlanSettings = {
    startDate: today_JST(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0],
    studyDays: ['月', '水', '金'],
    hoursPerWeekday: 1,
    hoursPerWeekend: 2,
    motivationLevel: 3,
};

export default function NewPlanPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [settings, setSettings] = useState<PlanSettings | null>(defaultSettings);
    const [isbn, setIsbn] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                router.push('/login');
            } else {
                setUser(currentUser);
            }
        });
        return () => unsubscribe();
    }, [router]);

    const handleSettingsChange = (field: keyof PlanSettings, value: any) => {
        if (settings) {
            setSettings({ ...settings, [field]: value });
        }
    };

    const handleCreatePlan = async () => {
        if (!user || !isbn || !settings) return;
        setIsSubmitting(true);
        setError(null);
        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/generate-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ isbn, planSettings: settings }),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || '計画の作成に失敗しました。');
            }
            const newPlan = await response.json();
            router.push(`/plan/${newPlan.id}`); // 作成した計画の詳細ページにリダイレクト
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
    }

    return (
        <Box>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <NewPlanForm
                isbn={isbn}
                onIsbnChange={setIsbn}
                settings={settings}
                onSettingsChange={handleSettingsChange}
                onCreatePlan={handleCreatePlan}
                isSubmitting={isSubmitting}
            />
        </Box>
    );
}