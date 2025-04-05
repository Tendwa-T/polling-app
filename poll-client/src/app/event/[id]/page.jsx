"use client"


import NavbarComponent from "@/app/components/Navbar";
import { Box, OutlinedInput, Button, InputAdornment, Typography, CircularProgress, RadioGroup, FormControlLabel, Radio, Paper, Snackbar, Alert } from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useLayoutEffect } from "react";
import { EventSource } from "eventsource";

export default function EventPage() {
    const [pageState, setPageState] = useState({
        isLoading: false,
        eventOpen: true,
        eventID: "",
        userID: "",
        activeQuestion: null,
        selectedAnswer: "",
        isLastQuestion: false,
        isAnswerSubmitted: false
    })
    const { isLoading, eventOpen, eventID, userID, activeQuestion, selectedAnswer, isLastQuestion, isAnswerSubmitted } = pageState
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
        eventLisRef.current = new EventSource("http://192.168.25.181:8000/api/v1/events/live-event/" + event.eventCode)
        setPageState({ ...pageState, eventID: eventID, userID: user })
    }, [])

    useLayoutEffect(() => {
        const event = JSON.parse(localStorage.getItem("event"))
        const user = JSON.parse(localStorage.getItem("userID"))
        const eventID = event.eventID
        console.log("From use Effect Layout State")
        console.log("Event ID:", eventID)
        console.log("User ID:", user)
        setPageState({ ...pageState, eventID: eventID, userID: user })
    }, [])
    function closeConection() {
        if (eventLisRef.current) {
            eventLisRef.current.close()
            eventLisRef.current = null
        }
    }

    function getPageState() {
        const event = JSON.parse(localStorage.getItem("event"))
        const user = JSON.parse(localStorage.getItem("userID"))
        const eventID = event.eventID
        console.log("From Get Page State")
        console.log("Event ID:", eventID)
        console.log("User ID:", user)
        setPageState({ ...pageState, eventID: eventID, userID: user })
        return { eventID, user }
    }

    async function handleSubmitResponse() {
        if (!selectedAnswer) {
            setSnackConfig({
                open: true,
                message: "Please select an answer",
                severity: "error"
            })
            return
        }
        const pg = getPageState()
        console.log("Page State:", pageState)
        setPageState({
            ...pageState, isLoading: true, activeQuestion: null,
        })
        closeConection()
        try {
            const res = await fetch("http://192.168.25.181:8000/api/v1/responses/submit-response", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    userID: pg.user,
                    eventID: pg.eventID,
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
            if (!data.success) {
                setPageState({
                    ...pageState,
                    isLoading: false,
                })
                return

            }
            setPageState({
                ...pageState,
                isAnswerSubmitted: true,
                activeQuestion: null,
                selectedAnswer: "",
            })
            return
        } catch (error) {
            console.log(error.message)
            setSnackConfig({
                open: true,
                message: "An Error Occurred: " + error.message,
                severity: "error"
            })
            setPageState({
                ...pageState,
                isLoading: false,
                activeQuestion: null,
                selectedAnswer: "",
            })
            closeConection()
            setTimeout(() => {
                setPageState({
                    ...pageState,
                    isLoading: false,
                    isAnswerSubmitted: false,
                    activeQuestion: null,
                    selectedAnswer: "",
                })
                router.push("/event/" + eventID)
            }, 400)
            return
        } finally {
            setPageState({
                ...pageState,
                isLoading: false,
                isAnswerSubmitted: true,
                activeQuestion: null,
                selectedAnswer: "",
            })
            eventLisRef.current = new EventSource("http://192.168.25.181:8000/api/v1/events/live-event/" + eventID)
        }
    }

    const handleMessage = (event) => {
        if (!event.data) {
            console.log("Received event with no data:", event);
            return;
        }


        try {
            const eventData = JSON.parse(event.data);
            console.log("eventData on message", eventData);

            if (eventData.eventEnded) {
                setSnackConfig({
                    open: true,
                    message: "Event Ended",
                    severity: "info"
                });
                closeConection();
                setPageState(prevState => ({
                    ...prevState,
                    isLoading: true,
                }));
                setTimeout(() => {
                    setPageState(prevState => ({
                        ...prevState,
                        isLoading: false,
                    }));
                    router.push("/event/end/" + eventData.eventCode);
                }, 400);
                return;
            }

            setPageState(prevState => {
                if (!prevState.activeQuestion || prevState.activeQuestion._id !== eventData.activeQuestion._id) {
                    return {
                        ...prevState,
                        activeQuestion: eventData.activeQuestion,
                        isAnswerSubmitted: false,
                        isLastQuestion: eventData.isLastQuestion || false,
                        isLoading: false
                    };
                }
                return prevState;
            });
        } catch (error) {
            console.error("Failed to parse JSON:", event.data, error);
        }
    };

    useEffect(() => {
        if (!eventLisRef.current) return;


        const handleError = (err) => {
            console.log("An Error Occurred: Connection to the server was lost", err);
            setSnackConfig({
                open: true,
                message: "An Error Occurred: Connection to the server was lost",
                severity: "error"
            });
        };

        eventLisRef.current.onmessage = handleMessage
        eventLisRef.current.onerror = handleError;

        return () => {
            eventLisRef.current?.close();
            setPageState(prevState => ({
                ...prevState,
                eventOpen: false
            }));
        };
    }, []); // Runs only once when the component mounts

    // ✅ NEW EFFECT: Reinitialize listener when activeQuestion is cleared
    useEffect(() => {
        if (activeQuestion === null) {
            console.log("activeQuestion is null, waiting for new question...");
            eventLisRef.current = new EventSource("http://192.168.25.181:8000/api/v1/events/live-event/" + eventID);
            eventLisRef.current.onmessage = handleMessage;
        }
    }, [activeQuestion]); // Runs whenever activeQuestion changes


    return (
        <>
            <NavbarComponent />
            <Box sx={{ display: 'flex', flexDirection: 'column', p: '1em', justifyContent: 'center', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', width: '50%', }}>
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
                                        onChange={(e) => setPageState({
                                            ...pageState,
                                            selectedAnswer: e.target.value,
                                        })}
                                    >
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                            {activeQuestion.choices.map((option, index) => (
                                                <FormControlLabel key={index} value={option} control={<Radio />} label={option} />
                                            ))}
                                        </Box>
                                    </RadioGroup>
                                </Box>
                                <Box sx={{ display: 'flex', my: '1em', width: '20em', justifyContent: 'space-around', }}>
                                    <Button variant="text" onClick={() => setPageState({
                                        ...pageState,
                                        selectedAnswer: "",
                                    })}>
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