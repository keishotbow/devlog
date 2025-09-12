import { Box } from '@mui/material';
import SideNav from '@/components/SideNav'; // すぐに作成します

export default function DashboardLayout({ children, }: { children: React.ReactNode; }) {
    return (
        <Box sx={{ display: 'flex', height: '100vh' }}>
            {/* 左側に表示されるサイドナビゲーション */}
            <SideNav />

            {/* 右側に表示されるメインコンテンツ */}
            <Box component="main" sx={{ flexGrow: 1, p: 3, overflowY: 'auto' }}>
                {children}
            </Box>
        </Box>
    );
}