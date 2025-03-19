"use client"


import NavbarComponent from "@/app/components/Navbar";
import { Box, OutlinedInput, Button, InputAdornment, Typography, CircularProgress, RadioGroup, FormControlLabel, Radio, Paper, Snackbar, Alert } from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { EventSource } from "eventsource";
import { throttle } from "lodash";

export default function EventPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [eventOpen, setEventOpen] = useState(true)
    const [eventID, setEventID] = useState("")
    const [userID, setUserID] = useState("")
    const [activeQuestion, setActiveQuestion] = useState(null)
    const [selectedAnswer, setSelectedAnswer] = useState()
    const [isLastQuestion, setIsLastQuestion] = useState(false)
    const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false)
    const router = useRouter()
    const eventLisRef = useRef(null)

    const [snackConfig, setSnackConfig] = useState({
        open: false,
        message: "",
        severity: ""
    })

    useEffect(() => {
        const event = JSON.parse(localStorage.getItem("event"))
        const user = JSON.parse(localStorage.getItem("userID"))
        const eventID = event.eventID
        eventLisRef.current = new EventSource("http://localhost:8000/api/v1/events/live-event/" + event.eventCode)
        setEventID(eventID)
        setUserID(user)
    }, [])

    function closeConection() {
        if (eventLisRef.current) {
            eventLisRef.current.close()
            eventLisRef.current = null
        }
    }

    async function handleSubmitResponse() {
        setIsLoading(true)
        closeConection()
        setActiveQuestion(null)
        try {
            const res = await fetch("http://localhost:8000/api/v1/responses/submit-response", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    userID: userID,
                    eventID: eventID,
                    questionID: activeQuestion._id,
                    answer: selectedAnswer
                })
            })
            const data = await res.json()
            console.log(data)
            setSnackConfig({
                open: true,
                message: data.message,
                severity: data.success ? "success" : "error"
            })
            setIsLoading(false)
            setIsAnswerSubmitted(true)
            eventLisRef.current = new EventSource("http://localhost:8000/api/v1/events/live-event/" + eventID)
        } catch (error) {
            console.log(error.message)
            setSnackConfig({
                open: true,
                message: "An Error Occurred: " + error.message,
                severity: "error"
            })
            setIsLoading(false)
            eventLisRef.current = new EventSource("http://localhost:8000/api/v1/events/live-event/" + eventID)
        } finally {
            setIsAnswerSubmitted(false)
        }
    }

    useEffect(() => {

        eventLisRef.current.onmessage = function (event) {
            const eventData = JSON.parse(event.data)
            console.log("eventData on message", eventData)

            if (eventData.eventEnded) {
                setSnackConfig({
                    open: true,
                    message: "Event Ended",
                    severity: "info"
                })
                closeConection()
                setIsLoading(true)
                setTimeout(() => {
                    setIsLoading(false)
                    router.push("/event/end/" + eventData.eventCode)
                }, 400)
                return
            }
            //check if the active question is null
            if (!activeQuestion) {
                setActiveQuestion(eventData.activeQuestion)
                setIsAnswerSubmitted(false)
                return
            } else {
                // compare the active question to the incoming question via id
                if (activeQuestion._id === eventData._id) {
                    return
                }
                setActiveQuestion(eventData.activeQuestion)
                setIsAnswerSubmitted(false)
            }
            if (eventData.isLastQuestion) {
                setIsLastQuestion(true)
            }
        }

        eventLisRef.current.onerror = (err) => {
            console.log("An Error Occurred: Connection to the server was lost", err)
            setSnackConfig({
                open: true,
                message: "An Error Occurred: Connection to the server was lost",
                severity: "error"
            })

        }


        return () => {
            eventLisRef.current?.close()
            setEventOpen(false)
        }
    }, [])

    return (
        <>
            <NavbarComponent />
            <Box sx={{ display: 'flex', flexDirection: 'column', p: '1em', justifyContent: 'center', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', width: '50%', }}>
                    {isAnswerSubmitted ? <>
                        <Paper sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: '2em', borderRadius: '2em' }}>
                            <Typography variant="h6">
                                Response Submitted Successfully
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', my: '1em' }}>
                                <CircularProgress />
                                <Typography>
                                    Loading Next Question...
                                </Typography>
                            </Box>
                        </Paper>
                    </> :
                        <>
                            {activeQuestion ?
                                <>
                                    <Paper sx={{ display: 'flex', flexDirection: 'column', alignItems: 'start', justifyContent: 'start', p: '2em', borderRadius: '2em' }}>
                                        <Typography variant="h6">
                                            {activeQuestion.text}
                                        </Typography>
                                        <Box sx={{ my: '1em', mx: '2em' }}>
                                            <RadioGroup
                                                aria-labelledby="Choice selector"
                                                value={selectedAnswer ? selectedAnswer : " "}
                                                onChange={(e) => setSelectedAnswer(e.target.value)}
                                            >
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                    {activeQuestion.choices.map((option, index) => (
                                                        <FormControlLabel key={index} value={option} control={<Radio />} label={option} />
                                                    ))}
                                                </Box>
                                            </RadioGroup>
                                        </Box>
                                        <Box sx={{ display: 'flex', my: '1em', width: '20em', justifyContent: 'space-around', }}>
                                            <Button variant="text" onClick={() => setSelectedAnswer("")}>
                                                Clear
                                            </Button>
                                            <Button variant="contained" onClick={() => handleSubmitResponse()}>
                                                Submit
                                            </Button>
                                        </Box>
                                    </Paper>
                                </>
                                :
                                <Box sx={{ display: 'flex', width: '100%', height: '70vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: '2em' }}>
                                    <CircularProgress />
                                    <Typography>
                                        Loading Questions... Please Wait
                                    </Typography>
                                </Box>

                            }
                        </>

                    }

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
        </>
    )
}