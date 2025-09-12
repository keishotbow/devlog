'use client';
import { Card, CardContent, Typography, TextField, Button, CircularProgress, Box, Slider, ToggleButtonGroup, ToggleButton } from '@mui/material';
import type { PlanSettings } from '@/app/(dashboard)/page'; // page.tsxから型定義をインポート

// --- Propsの型定義 ---
interface NewPlanFormProps {
    isbn: string;
    onIsbnChange: (value: string) => void;
    settings: PlanSettings | null;
    onSettingsChange: (field: keyof PlanSettings, value: any) => void;
    onCreatePlan: () => void;
    isSubmitting: boolean;
}

const today_JST = () => new Date(new Date().getTime() + 9 * 60 * 60 * 1000).toISOString().split('T')[0];

export default function NewPlanForm({ isbn, onIsbnChange, settings, onSettingsChange, onCreatePlan, isSubmitting }: NewPlanFormProps) {
    if (!settings) return null; // settingsが読み込まれるまで表示しない

    return (
        <Card>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h5">新しい学習計画を作成</Typography>

                <TextField
                    fullWidth
                    label="参考書のISBNコード"
                    value={isbn}
                    onChange={(e) => onIsbnChange(e.target.value)}
                    placeholder="例: 9784873115658"
                />

                <Typography variant="h6" sx={{ mt: 2 }}>プラン設定</Typography>

                <TextField
                    label="学習開始日"
                    type="date"
                    value={settings.startDate}
                    onChange={(e) => onSettingsChange('startDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                />

                <TextField
                    label="目標達成日"
                    type="date"
                    value={settings.endDate}
                    onChange={(e) => onSettingsChange('endDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                />

                <Box>
                    <Typography gutterBottom>学習可能な曜日</Typography>
                    <ToggleButtonGroup
                        value={settings.studyDays}
                        onChange={(e, newDays) => onSettingsChange('studyDays', newDays)}
                    >
                        {['月', '火', '水', '木', '金', '土', '日'].map(day => (
                            <ToggleButton key={day} value={day}>{day}</ToggleButton>
                        ))}
                    </ToggleButtonGroup>
                </Box>

                <Box>
                    <Typography gutterBottom>平均学習時間（平日）: {settings.hoursPerWeekday}時間</Typography>
                    <Slider
                        value={settings.hoursPerWeekday}
                        onChange={(e, value) => onSettingsChange('hoursPerWeekday', value)}
                        step={0.5} min={0.5} max={8}
                        valueLabelDisplay="auto"
                    />
                </Box>

                <Box>
                    <Typography gutterBottom>平均学習時間（休日）: {settings.hoursPerWeekend}時間</Typography>
                    <Slider
                        value={settings.hoursPerWeekend}
                        onChange={(e, value) => onSettingsChange('hoursPerWeekend', value)}
                        step={0.5} min={0.5} max={12}
                        valueLabelDisplay="auto"
                    />
                </Box>

                <Box>
                    <Typography gutterBottom>やる気レベル: {settings.motivationLevel}</Typography>
                    <Slider
                        value={settings.motivationLevel}
                        onChange={(e, value) => onSettingsChange('motivationLevel', value)}
                        step={1} min={1} max={5}
                        marks={[{ value: 1, label: '余裕をもって' }, { value: 5, label: '限界まで挑戦' }]}
                    />
                </Box>

                <Button fullWidth variant="contained" onClick={onCreatePlan} disabled={isSubmitting || !isbn}>
                    {isSubmitting ? <CircularProgress size={24} /> : '計画を作成'}
                </Button>
            </CardContent>
        </Card>
    );
}
