"use client";

import { Box, InputAdornment, OutlinedInput, Button, Snackbar, Alert } from "@mui/material";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function EnterDetailsComponent() {
    const [isLoading, setIsLoading] = useState(false)
    const [data, setData] = useState({
        eventCode: "",
        userName: ""
    })
    const [snackConfig, setSnackConfig] = useState({
        open: false,
        message: "",
        severity: ""
    })
    const router = useRouter()

    async function handleNext() {
        setIsLoading(true)
        //fetch from localhost:8000 and save information to localstorage
        try {
            const res = await fetch("http://192.168.25.181:8000/api/v1/events/join-event/" + data.eventCode, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    userName: data.userName
                })
            })
            const event = await res.json()
            console.log("Event: ", event)
            setSnackConfig({
                open: true,
                message: event.message,
                severity: event.success ? "success" : "error"
            })
            if (!event.success) {
                setIsLoading(false)
                return
            }
            console.log("EventData: ", event.data.event)
            localStorage.setItem("event", JSON.stringify(event.data.event))
            localStorage.setItem("userID", JSON.stringify(event.data.userID))
            localStorage.setItem("userName", data.userName)
            setTimeout(() => {
                router.push("/event/" + data.eventCode)
            }, 1000)
        } catch (error) {
            console.log(error.message)
            setSnackConfig({
                open: true,
                message: "An Error Occurred: " + error.message,
                severity: "error"
            })
        }
    }


    return (
        <Box sx={{ minHeight: '90dvh', minWidth: '100dvw', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', }}>
                <OutlinedInput
                    id="eventCode"
                    placeholder="Enter Code Here"
                    sx={{ width: { xs: '20em', md: "25em" }, borderRadius: '30em', my: '1em' }}
                    startAdornment={<>
                        <InputAdornment position="start">
                            #
                        </InputAdornment>
                    </>}
                    value={data.eventCode}
                    onChange={(e) => setData({ ...data, eventCode: e.target.value })}
                />

                <OutlinedInput
                    id="filled-basic"
                    placeholder="Enter Your Username Here"
                    sx={{ width: { xs: '20em', md: "25em" }, borderRadius: '30em', my: '1em' }}
                    startAdornment={<>
                        <InputAdornment position="start">
                            ABC
                        </InputAdornment>
                    </>}
                    value={data.userName}
                    onChange={(e) => setData({ ...data, userName: e.target.value })}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: '1em' }}>
                    <Button variant="text" onClick={() => { setData({ eventCode: "", userName: "" }) }}>Cancel</Button>
                    <Button variant="contained" sx={{ borderRadius: '1em' }} onClick={() => handleNext()}>Submit</Button>
                </Box>

            </Box>
            <Snackbar
                open={snackConfig.open}
                autoHideDuration={6000}
                onClose={() => setSnackConfig({ ...snackConfig, open: false })}
            >
                <Alert severity={snackConfig.severity} onClose={() => setSnackConfig({ ...snackConfig, open: false })}>
                    {snackConfig.message}
                </Alert>
            </Snackbar>
        </Box>
    )
}