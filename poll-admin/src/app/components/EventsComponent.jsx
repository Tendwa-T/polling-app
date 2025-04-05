"use client"

import { useApp } from "@/context/app/useApp"
import { Alert, Box, Button, Card, CardActionArea, CardContent, Dialog, DialogContent, DialogTitle, List, ListItem, ListItemButton, ListItemText, Snackbar, TextField, Typography } from "@mui/material"
import { DatePicker } from "@mui/x-date-pickers"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

/**
 * The Event component serves as the official event entry point.
 * It renders the events section which shows the events that are currently active.
 * It also allows a user to create an event
 * and an EventsComponent nested within the NavbarComponent.
 *
 * @component
 * @returns {JSX.Element} The rendered Event component.
 */

export default function EventsComponent() {
    const { events, getEvents } = useApp()
    const router = useRouter()


    useEffect(() => {
        const adUser = JSON.parse(localStorage.getItem("user"))
        if (!adUser) {
            router.push("/auth")
            return
        }
        const adminID = adUser._id || ""
        const res = getEvents(adminID)
        if (!res.success) {
            if (res.redirect) {
                router.push(res.route)
                return
            }
        }
        //Write a function that fetches from the backend every 10 seconds, if events are found, stop fetching and display the events
        if (events.length === 0) {
            if (adminID) {
                getEvents(adminID)
                const interval = setInterval(() => {
                    getEvents(adminID)
                }, 10000)

                return () => clearInterval(interval)
            }
        }

    }, [])


    return (
        <Box sx={{ display: 'flex', height: "80vh", justifyContent: 'center', alignItems: 'center', }}>
            {events.length > 0 ?
                <EventList data={events} />
                : <CreateEventModal />}
        </Box>

    )
}

function CreateEventModal() {
    const [modalOpen, setModalOpen] = useState(false)
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [eventName, setEventName] = useState("")
    const [eventDescription, setEventDescription] = useState("")
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

            <Card sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '40%', height: '20em', }}>
                <CardActionArea onClick={() => {
                    toggleModal()
                }}
                >
                    <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', }}>
                        <Image src={"/illustrations/undraw_create_8val.svg"} width={200} height={200} alt="Create Event Icon" />
                        <Typography variant="h4" sx={{ mt: 2 }}>
                            Create an event
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 2 }}>
                            Run polls and Interactive sessions in your browser
                        </Typography>
                    </CardContent>
                </CardActionArea >
            </Card>
            <Dialog
                open={modalOpen}
                onClose={toggleModal}
            >
                <DialogTitle>
                    Create an event
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

function EventList({ data }) {
    const router = useRouter()
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'start', justifyContent: 'start', width: '100vw', }}>
            <List sx={{ width: '100%', maxWidth: 360, }}>
                {data.map((event, index) => {
                    return (
                        <ListItem key={index} sx={{ width: '100%' }}>
                            <ListItemButton onClick={() => {
                                router.push(`/event/${event._id}`)
                            }}>
                                <ListItemText primary={event.name} secondary={event.description} />
                            </ListItemButton>
                        </ListItem >
                    )
                })}
            </List>
        </Box>
    )
}

