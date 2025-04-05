"use client"

import NavbarComponent from "@/app/components/Navbar"
import { Box, Card, CardContent, CardHeader, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material"
import { set } from "lodash";
import { use, useEffect, useState } from "react";



//This page implements analytics for the end of an event

export default function EventEnd() {
    const [questions, setQuestions] = useState([]);
    const [results, setResults] = useState([]);
    const [analysis, setAnalysis] = useState([]);


    useEffect(() => {
        //fetch all questions and results
        const eventID = JSON.parse(localStorage.getItem('event')).eventID;
        fetchQuestions(eventID);
    }, []);

    const fetchQuestions = async (eID) => {
        const response = await fetch('http://192.168.25.181:8000/api/v1/results/' + eID);
        const data = await response.json();
        console.log("Data from fetchQuestions", data);
        setQuestions(data.data.questions);
        setResults(data.data.participantBreakdown);
    }

    const fetchResults = async (eID) => {
        const response = await fetch('http://192.168.25.181:8000/api/v1/results/' + eID);
        const data = await response.json();
        console.log("Data from fetchResults", data);
        setResults(data.data.results);
    }


    return (
        <>
            <NavbarComponent />
            <Box sx={{ display: 'flex', flexDirection: 'column', m: '1em' }}>
                <Typography variant="h4">Results Page</Typography>
            </Box>
            <Box sx={{ display: 'flex', m: '1em', }}>
                <div className="h-[80vh] bg-red-500 p-[0.5em]">
                    div 1
                    <Card>
                        <CardHeader title="Results" />
                        <CardContent>
                            <Typography variant="h5">Results</Typography>
                            <Typography variant="body1">Results will be displayed here</Typography>
                        </CardContent>
                    </Card>

                    <Card sx={{ mt: '1em' }}>
                        <CardHeader title="Analysis" />
                        <CardContent>
                            <Typography variant="h5">Analysis</Typography>
                            <Typography variant="body1">Analysis will be displayed here</Typography>
                        </CardContent>
                    </Card>
                </div>
                <div className="flex flex-col flex-grow  h-[80vh] bg-blue-500 p-[0.5em]">
                    div 2
                    <Box>
                        <TableContainer component={Paper}>
                            <Table sx={{ minWidth: 650 }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Question</TableCell>
                                        <TableCell align="center">Option A</TableCell>
                                        <TableCell align="center">Option B</TableCell>
                                        <TableCell align="center">Option C</TableCell>
                                        <TableCell align="center">Option D</TableCell>
                                        <TableCell align="right">Correct Answer</TableCell>
                                        <TableCell align="right">Correct %</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {questions.map((question, index) => (
                                        <TableRow
                                            key={index + 1}
                                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                        >
                                            <TableCell component="th" scope="row" >
                                                {question.text}
                                            </TableCell>
                                            {question.stats.options.map((option, index) => (
                                                <TableCell id={`stat${index + 2}`} align="center"><p>{option.option}</p><p>{option.count} votes</p></TableCell>
                                            ))}
                                            <TableCell align="right">{question.stats.correctAnswer}</TableCell>
                                            <TableCell align="right">{parseFloat(question.stats.correctPercentage).toFixed(2)} %</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                    <Box sx={{ mt: '1em' }}>
                        <TableContainer component={Paper}>
                            <Table sx={{ minWidth: 650 }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Participant ID</TableCell>
                                        <TableCell align="center">Question</TableCell>
                                        <TableCell align="center">Answered</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {results.map((result, index) => (
                                        <TableRow
                                            key={index}
                                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                        >
                                            <TableCell component="th" scope="row">
                                                {result.userID}
                                            </TableCell>
                                            <TableCell align="center">{result.userName}</TableCell>
                                            <TableCell align="center">{result.answered}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </div>
            </Box>
        </>

    )
}