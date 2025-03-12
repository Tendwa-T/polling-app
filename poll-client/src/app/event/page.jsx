"use client"


import NavbarComponent from "@/app/components/Navbar";
import { Box, OutlinedInput, Button, InputAdornment, Typography } from "@mui/material";
import Person4OutlinedIcon from '@mui/icons-material/Person4Outlined';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function EventPage() {

    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    async function handleNext() {
        setIsLoading(true)
        setTimeout(() => {
            setIsLoading(false)
            router.push("/event/")
        }, 400)
    }
    return (
        <>
            <NavbarComponent />
            <Box sx={{ display: 'flex', flexDirection: 'column', p: '1em', justifyContent: 'center', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>


                    <Box sx={{ my: '1em' }}>
                        <Box sx={{ display: 'flex', ml: '2em', color: 'gray' }}>
                            <EmojiEventsOutlinedIcon />
                            <Typography ml={'0.5em'}>Test Slido</Typography>
                        </Box>
                        <OutlinedInput
                            id="filled-basic"
                            placeholder="Enter Code Here"
                            sx={{ width: '40em', borderRadius: '1em' }}
                            endAdornment={<>
                                <InputAdornment position="end">
                                    {isLoading ? <CircularProgress size={'2em'} /> :
                                        <Button onClick={() => handleNext()} disabled={isLoading} variant="contained" sx={{ borderRadius: '2em' }}>
                                            Join
                                        </Button>}
                                </InputAdornment>
                            </>}
                            startAdornment={<>
                                <InputAdornment position="start">
                                    <Person4OutlinedIcon />
                                </InputAdornment>
                            </>}
                        />
                    </Box>
                </Box>


            </Box>
        </>
    )
}