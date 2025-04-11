"use client"


import NavbarComponent from "@/app/components/Navbar";
import { Box, OutlinedInput, Button, InputAdornment, Typography, CircularProgress, RadioGroup, FormControlLabel, Radio, Paper, Snackbar, Alert, LinearProgress } from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useLayoutEffect } from "react";
import { EventSource } from "eventsource";
const baseAPI = process.env.NEXT_PUBLIC_BASE_API

export default function EventPage() {
    const [pageState, setPageState] = useState({
        isLoading: false,
        eventOpen: true,
        eventUuid: "",
        userID: "",
        activeQuestion: null,
        selectedAnswer: "",
        isLastQuestion: false,
        isAnswerSubmitted: false,
        showResult: false,
        showLobby: false,
        showLeaderBoard: false,
        eventState: "",
        eventEnded: false,
        qData: {},
    })
    const { eventUuid, activeQuestion, selectedAnswer, qData, showResult, showLobby, showLeaderBoard } = pageState
    const router = useRouter()
    const eventLisRef = useRef(null)
    const resultLisRef = useRef(null)

    const [snackConfig, setSnackConfig] = useState({
        open: false,
        message: "",
        severity: ""
    })


    useEffect(() => {
        const event = JSON.parse(localStorage.getItem("event"))
        const user = JSON.parse(localStorage.getItem("userID"))
        const eventUuid = event.eventUuid
        eventLisRef.current = new EventSource(`${baseAPI}/api/v2/events/live-event/` + event.eventUuid)
        setPageState({ ...pageState, eventUuid: eventUuid, userID: user })
    }, [])

    useLayoutEffect(() => {
        const event = JSON.parse(localStorage.getItem("event"))
        const user = JSON.parse(localStorage.getItem("userID"))
        const eventUuid = event.eventUuid
        console.log("From use Effect Layout State")
        console.log("Event ID:", eventUuid)
        console.log("User ID:", user)
        setPageState({ ...pageState, eventUuid: eventUuid, userID: user })
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
        const eventUuid = event.eventUuid
        console.log("From Get Page State")
        console.log("Event ID:", eventUuid)
        console.log("User ID:", user)
        setPageState({ ...pageState, eventUuid: eventUuid, userID: user })
        return { eventUuid, user }
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
            const res = await fetch(`${baseAPI}/api/v2/events/vote`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    userID: pg.user,
                    eventUuid: pg.eventUuid,
                    questionUuid: activeQuestion.uuid,
                    optionUuid: selectedAnswer
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
                selectedAnswer: "",
                showLobby: true,
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
                selectedAnswer: "",
            })
            closeConection()
            setTimeout(() => {
                setPageState({
                    ...pageState,
                    isLoading: false,
                    isAnswerSubmitted: false,
                    selectedAnswer: "",
                })
                router.push("/event/" + eventUuid)
            }, 400)
            return
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
                        eventState: eventData.eventState,
                        activeQuestion: eventData.activeQuestion,
                        isAnswerSubmitted: false,
                        isLastQuestion: eventData.isLastQuestion || false,
                        isLoading: false

                    };
                }
                if (eventData.eventState === "result-wait") {
                    return {
                        ...prevState,
                        eventState: eventData.eventState,
                        showResult: false,
                        showLobby: true,
                        isLoading: false,
                        activeQuestion: eventData.activeQuestion,
                        qData: {
                            questionUuid: eventData.questionUuid,
                            correctOption: eventData.correctOption,
                        }
                    }
                }
                if (eventData.eventState === "result-show") {
                    return {
                        ...prevState,
                        eventState: eventData.eventState,
                        showResult: true,
                        showLobby: true,
                        isLoading: false,
                        activeQuestion: eventData.activeQuestion,
                        qData: {
                            questionUuid: eventData.questionUuid,
                            correctOption: eventData.correctOption,
                        }
                    }
                }
                if (eventData.eventState === "result-update") {
                    return {
                        ...prevState,
                        eventState: eventData.eventState,
                        activeQuestion: eventData.activeQuestion,
                    }
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
            eventLisRef.current = new EventSource(`${baseAPI}/api/v2/events/live-event/` + eventUuid);
            eventLisRef.current.onmessage = handleMessage;
        }
    }, [activeQuestion]); // Runs whenever activeQuestion changes

    function QuestionComponent() {
        return (
            <Paper sx={{ display: 'flex', flexDirection: 'column', alignItems: 'start', justifyContent: 'start', p: '2em', borderRadius: '2em' }}>
                <Typography variant="h6">
                    {activeQuestion.title}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'start', justifyContent: 'start', my: '1em' }}>
                    <RadioGroup
                        aria-labelledby="Choice selector"
                        value={selectedAnswer ? selectedAnswer : " "}
                        onChange={(e) => setPageState({
                            ...pageState,
                            selectedAnswer: e.target.value,
                        })}
                    >
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            {activeQuestion.options.map((option) => (
                                <FormControlLabel key={option.uuid} value={option.uuid} control={<Radio />} label={option.label} />
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
        )
    }

    function LoadingComponent() {
        return (
            <Box sx={{ display: 'flex', width: '100%', height: '70vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: '2em' }}>
                <CircularProgress />
                <Typography>
                    Loading Questions... Please Wait
                </Typography>
            </Box>
        )
    }

    function SnackBarComponent() {
        return (
            <Snackbar
                open={snackConfig.open}
                autoHideDuration={6000}
                onClose={() => setSnackConfig({ ...snackConfig, open: false })}
            >
                <Alert severity={snackConfig.severity} onClose={() => setSnackConfig({ ...snackConfig, open: false })}>
                    {snackConfig.message}
                </Alert>
            </Snackbar>
        )
    }

    function LobbyComponent() {
        return (
            <>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: '2em' }}>
                    {showResult ?
                        <>
                            <Typography>
                                Lobby with Result Shown
                            </Typography>
                        </>
                        :
                        <>
                            <Paper sx={{ display: 'flex', width: "60vw", flexDirection: 'column', alignItems: 'start', justifyContent: 'start', p: '1em', borderRadius: '2em' }}>
                                <Typography variant="h6">
                                    {activeQuestion.title}
                                </Typography>
                                <Box sx={{ width: '100%' }}>
                                    {activeQuestion.options.map((option) => (
                                        <Box key={option.uuid} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'start', justifyContent: 'center', my: '1em' }}>
                                            <Typography variant="body1" sx={{ my: '0.5em' }}>
                                                {option.label}
                                            </Typography>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                                <LinearProgress variant="determinate" value={option.votePercentage} sx={{ width: '50vw', height: '1em', borderRadius: '1em', }} />
                                                <Typography variant="caption" sx={{ display: 'flex', color: 'grey' }}>
                                                    {option.votePercentage} %
                                                </Typography>
                                            </Box>
                                        </Box>

                                    ))}
                                </Box>
                            </Paper>
                        </>}
                </Box>
            </>

        )
    }

    function LeaderBoardComponent() {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: '2em' }}>
                <Typography>
                    This is the Leaderboard
                </Typography>
            </Box>
        )
    }
    return (
        <>
            <NavbarComponent />
            <Box sx={{ display: 'flex', flexDirection: 'column', p: '1em', justifyContent: 'center', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', width: '50%', }}>
                    {activeQuestion && pageState.eventState === "question" ?
                        <>
                            <QuestionComponent />
                        </>
                        :
                        <>
                            {showLobby &&
                                <>
                                    <LobbyComponent />
                                </>
                            }
                            {showLeaderBoard &&
                                <>
                                    <LeaderBoardComponent />
                                </>
                            }
                            {!activeQuestion && !showLobby && !showLeaderBoard &&
                                <>
                                    <LoadingComponent />
                                </>
                            }
                            {pageState.isLoading &&
                                <>
                                    <LoadingComponent />
                                </>
                            }

                        </>
                    }
                </Box>
                <SnackBarComponent />
            </Box>
        </>
    )
}