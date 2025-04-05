
"use client"

import NavbarComponent from "@/app/components/Navbar";
import { useApp } from "@/context/app/useApp";
import { useUser } from "@/context/user/useUser";
import { Alert, Box, Button, CircularProgress, Dialog, List, ListItem, Typography } from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function EventPage() {
    // Retrieve the event ID from the URL
    const { id } = useParams();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { getEvent, startEvent, endEvent } = useApp();
    const { user } = useUser();
    const [tempUser, setTempUser] = useState(user);
    const router = useRouter();

    // Fetch the event data from the server
    useEffect(() => {
        if (!tempUser) {
            setTempUser(
                JSON.parse(localStorage.getItem("user")) || {
                    isAdmin: false,
                    isAuth: false,
                }
            )
        }
        async function fetchData() {
            if (!event) {
                const response = await getEvent(id);
                if (response.success) {
                    setEvent(response.data);
                    setError(null);
                } else {
                    if (response.message === "jwt expired") {
                        router.push("/auth");
                    }
                    setError(response.message);
                }
                setLoading(false);
            }
        }
        fetchData();
    }, [id, getEvent]);

    // Handle starting the event
    async function startEventFE() {
        const response = await startEvent(id);
        if (response.success) {
            setEvent({ ...event, status: "live" });
        } else {
            setError(response.message);
        }
    }

    // Handle ending the event
    async function endEventFE() {
        const response = await endEvent(id);
        if (response.success) {
            setEvent({ ...event, status: "completed" });
        } else {
            setError(response.message);
        }
    }

    // Redirect to the event results page
    function viewResults() {
        router.push(`/event/results/${id}`);
    }

    // Render the event page
    return (
        <Box>
            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", alignItems: 'center', height: '80vh' }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert severity="error">{error}</Alert>
            ) : (
                <>
                    <NavbarComponent>
                        <EventDetails
                            event={event}
                            user={tempUser}
                            startEvent={startEventFE}
                            endEvent={endEventFE}
                            viewResults={viewResults}
                        />
                    </NavbarComponent>
                </>

            )}
        </Box>
    );
}

function EventDetails({ event, user, startEventFE, endEventFE, viewResults }) {
    const isAdmin = user.isAdmin;
    const isLive = event.status === "live";
    const isCompleted = event.status === "completed";
    const router = useRouter();

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                <Button variant="contained" color="primary" onClick={() => router.back()}>
                    Back
                </Button>
                <Button variant="contained" color="primary" >
                    Add Question
                </Button>
            </Box>

            <Typography variant="h4">{event.name}</Typography>
            <Typography variant="body1">{event.description}</Typography>
            <Typography variant="body2">Start Date: {event.startDate}</Typography>
            <Typography variant="body2">End Date: {event.endDate}</Typography>
            <Typography variant="body2">Status: {event.status}</Typography>
            {isAdmin && !isLive && !isCompleted && (
                <Button variant="contained" color="primary" onClick={startEventFE}>
                    Start Event
                </Button>
            )}
            {isAdmin && isLive && (
                <Button variant="contained" color="secondary" onClick={endEventFE}>
                    End Event
                </Button>
            )}
            {event.questions.length > 0 && (
                <QuestionList questions={event.questions} />
            )}

            <Button variant="contained" color="primary" onClick={viewResults}>
                View Results
            </Button>
        </Box>
    );
}

function QuestionList({ questions }) {
    return (
        <Box>
            {questions.map((question) => (
                <Question key={question._id} question={question} />
            ))}
        </Box>
    );
}

function Question({ question }) {
    return (
        <Box>
            <Typography variant="h6">{question.text}</Typography>
            <Typography variant="body1">Type: {question.type}</Typography>
            <Typography variant="body1">Options:</Typography>
            <List>
                {question.choices.map((option, index) => (
                    <ListItem key={index}>{option}</ListItem>
                ))}
            </List>
        </Box>
    );
}

function AddQuestion() {
    const [modalOpen, setModalOpen] = useState(false)
    const [type, setType] = useState("multiple_choice")
    const [text, setText] = useState("")
    const [choices, setChoices] = useState([])
    const [adminID, setAdminID] = useState("")
    const { createEvent } = useApp()
    const [snack, setSnack] = useState({
        open: false,
        success: false,
        message: "",
    })

    const handleClose = () => {
        setSnack({
            ...snack,
            open: false
        })
    }

    function handleSnack(open, success, message) {
        setSnack({
            open: open,
            success: success,
            message: message,
        })
    }

    useEffect(() => {
        setAdminID(localStorage.getItem("adminID"))
    }, [])




    function toggleModal() {
        setModalOpen(!modalOpen)
    }

    async function submitData() {
        const adminIDStr = JSON.parse(localStorage.getItem("user"))._id
        const response = await createEvent(eventName, eventDescription, adminIDStr, startDate, endDate)

        if (response.success) {
            setTimeout(() => {
                toggleModal()
            }, 1000)
            handleSnack(true, true, response.message)
        } else {
            handleSnack(true, false, response.message)
        }
    }
    return (
        <>

            <Button variant="contained" color="primary" onClick={toggleModal}>
                Add Question
            </Button>
            <Dialog
                open={modalOpen}
                onClose={toggleModal}
            >
                <DialogTitle>
                    Add a Question
                </DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', }}>
                    <Box>
                        <Box sx={{ display: 'flex', my: 2 }}>
                            <TextField
                                id="startDate"
                                label="Start Date"
                                type="date"
                                slotProps={{
                                    inputLabel: {
                                        shrink: true,
                                    },
                                }}
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                            <Box sx={{ width: '3em' }} />
                            <TextField
                                id="endDate"
                                label="End Date"
                                type="date"
                                slotProps={{
                                    inputLabel: {
                                        shrink: true,
                                    },
                                }}
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </Box>

                        <Box sx={{ display: 'flex', my: 2 }}>
                            <TextField
                                id="eventName"
                                label="Event Name"
                                value={eventName}
                                fullWidth
                                onChange={(e) => setEventName(e.target.value)}
                            />
                        </Box>

                        <Box sx={{ display: 'flex', my: 2, justifyContent: 'space-around' }}>
                            <Button variant="outlined" color="primary" onClick={toggleModal}>Cancel</Button>
                            <Button variant="contained" color="primary" onClick={submitData}>Create Event</Button>
                        </Box>

                    </Box>
                </DialogContent>
            </Dialog>
            <Snackbar
                open={snack.open}
                onClose={handleClose}
                key={"Reg-Snack"}
                autoHideDuration={1200}
            >
                <Alert
                    onClose={handleClose}
                    severity={snack.success ? "success" : "error"}
                >
                    {snack.message}
                </Alert>
            </Snackbar>
        </>
    )
}