'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { Box, CircularProgress, Alert, Typography, Button, Grid, Card, CardContent, CardActions, IconButton, Menu, MenuItem } from '@mui/material';
import Link from 'next/link';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import type { Plan } from './plan/[planId]/page'; // 新しい詳細ページから型をインポート

export default function PlanListPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- カードのメニュー表示用 ---
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

  const fetchPlans = useCallback(async (firebaseUser: User) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/get-plans', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || '計画の読み込みに失敗しました。');
      }
      const fetchedPlans = await response.json();
      setPlans(fetchedPlans);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchPlans(currentUser);
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router, fetchPlans]);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, planId: number) => {
    setAnchorEl(event.currentTarget);
    setSelectedPlanId(planId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPlanId(null);
  };

  const handleDelete = async () => {
    if (!selectedPlanId || !user) return;
    // ユーザーに最終確認
    if (window.confirm("本当にこの計画を削除しますか？この操作は元に戻せません。")) {
      try {
        const token = await user.getIdToken();
        await fetch('/api/delete-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ planId: selectedPlanId })
        });
        // 成功したらリストを再読み込み
        fetchPlans(user);
      } catch (err) {
        setError('計画の削除に失敗しました。');
      }
    }
    handleMenuClose();
  };

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 64px)' }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">学習計画一覧</Typography>
        <Button variant="contained" startIcon={<AddCircleOutlineIcon />} component={Link} href="/plan/new">
          新しい計画を作成
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {plans.length > 0 ? (
          plans.map((plan) => (
            <Grid item xs={12} sm={6} md={4} key={plan.id}>
              <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="div" gutterBottom>
                    {plan.book_title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    目標達成日: {new Date(plan.plan_settings.endDate).toLocaleDateString()}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" component={Link} href={`/plan/${plan.id}`}>開く</Button>
                  <Box sx={{ flexGrow: 1 }} />
                  <IconButton size="small" aria-label="settings" onClick={(e) => handleMenuClick(e, plan.id)}>
                    <MoreVertIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Typography sx={{ p: 3, textAlign: 'center' }}>
              まだ学習計画がありません。右上のボタンから新しい計画を作成しましょう！
            </Typography>
          </Grid>
        )}
      </Grid>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { alert('複製機能は未実装です'); handleMenuClose(); }}>複製</MenuItem>
        <MenuItem onClick={() => { alert('アーカイブ機能は未実装です'); handleMenuClose(); }}>アーカイブ</MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>削除</MenuItem>
      </Menu>
    </Box>
  );
}

