"use client"

import { Box, CircularProgress, Typography } from "@mui/material"

export default function Loading() {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', }}>
                <CircularProgress />
                <Typography>
                    Loading...
                </Typography>
            </Box>
        </Box>
    )
}