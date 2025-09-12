// src/app/signup/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/config'; // 先ほど作成したconfigをインポート
import { Container, Box, TextField, Button, Typography } from '@mui/material';
import Link from 'next/link';

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault(); // フォームのデフォルト送信を防ぐ
        setError(null);

        try {
            // Firebaseの関数を使ってユーザーを作成
            await createUserWithEmailAndPassword(auth, email, password);
            // 成功したらダッシュボードに遷移
            router.push('/');
        } catch (error: any) {
            // エラー処理
            console.error(error);
            if (error.code === 'auth/email-already-in-use') {
                setError('このメールアドレスは既に使用されています。');
            } else {
                setError('アカウントの作成に失敗しました。');
            }
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Typography component="h1" variant="h5">
                    アカウント作成
                </Typography>
                <Box component="form" onSubmit={handleSignup} noValidate sx={{ mt: 1 }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="メールアドレス"
                        name="email"
                        autoComplete="email"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="パスワード"
                        type="password"
                        id="password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    {error && (
                        <Typography color="error" variant="body2" sx={{ mt: 2 }}>
                            {error}
                        </Typography>
                    )}
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                    >
                        アカウントを作成
                    </Button>
                    <Link href="/login" passHref>
                        <Typography variant="body2" align="center" sx={{ textDecoration: 'underline', cursor: 'pointer' }}>
                            すでにアカウントをお持ちの方はこちら
                        </Typography>
                    </Link>
                </Box>
            </Box>
        </Container>
    );
}