'use client';
import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, Typography } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import LogoutIcon from '@mui/icons-material/Logout';

export default function SideNav() {
    const handleLogout = async () => {
        await signOut(auth);
        // ログアウト後のリダイレクトはpage.tsxのuseEffectに任せる
    };

    return (
        <Box sx={{ width: 240, flexShrink: 0, bgcolor: 'background.paper', borderRight: '1px solid rgba(0, 0, 0, 0.12)' }}>
            <Box sx={{ p: 2 }}>
                <Typography variant="h6" component="div">
                    AI学習コーチ
                </Typography>
            </Box>
            <Divider />
            <List>
                <ListItem disablePadding>
                    <ListItemButton selected> {/* 現在のページなので選択状態にする */}
                        <ListItemIcon>
                            <DashboardIcon />
                        </ListItemIcon>
                        <ListItemText primary="学習ダッシュボード" />
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemButton>
                        <ListItemIcon>
                            <AccountCircleIcon />
                        </ListItemIcon>
                        <ListItemText primary="アカウント設定" />
                    </ListItemButton>
                </ListItem>
            </List>
            <Divider />
            <List>
                <ListItem disablePadding>
                    <ListItemButton onClick={handleLogout}>
                        <ListItemIcon>
                            <LogoutIcon />
                        </ListItemIcon>
                        <ListItemText primary="ログアウト" />
                    </ListItemButton>
                </ListItem>
            </List>
        </Box>
    );
}
