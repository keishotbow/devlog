'use client';
import { Box, Button, CircularProgress, Slider, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import type { PlanSettings } from '@/app/(dashboard)/page';

interface PlanSettingsProps {
    settings: PlanSettings | null;
    onSettingsChange: (field: keyof PlanSettings, value: any) => void;
    onSaveChanges: () => void;
    isChanged: boolean;
    isSubmitting: boolean;
}

export default function PlanSettings({ settings, onSettingsChange, onSaveChanges, isChanged, isSubmitting }: PlanSettingsProps) {
    if (!settings) return null;

    return (
        <Box component="form" noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                <Slider value={settings.hoursPerWeekday} onChange={(e, value) => onSettingsChange('hoursPerWeekday', value)} step={0.5} min={0.5} max={8} valueLabelDisplay="auto" />
            </Box>
            <Box>
                <Typography gutterBottom>平均学習時間（休日）: {settings.hoursPerWeekend}時間</Typography>
                <Slider value={settings.hoursPerWeekend} onChange={(e, value) => onSettingsChange('hoursPerWeekend', value)} step={0.5} min={0.5} max={12} valueLabelDisplay="auto" />
            </Box>
            <Box>
                <Typography gutterBottom>やる気レベル: {settings.motivationLevel}</Typography>
                <Slider value={settings.motivationLevel} onChange={(e, value) => onSettingsChange('motivationLevel', value)} step={1} min={1} max={5} marks={[{ value: 1, label: '余裕をもって' }, { value: 5, label: '限界まで挑戦' }]} />
            </Box>
            <Button variant="contained" onClick={onSaveChanges} disabled={!isChanged || isSubmitting}>
                {isSubmitting ? <CircularProgress size={24} /> : '変更を保存'}
            </Button>
        </Box>
    );
}
