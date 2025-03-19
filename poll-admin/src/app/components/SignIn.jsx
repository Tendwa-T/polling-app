"use client"

import { Visibility, VisibilityOff } from "@mui/icons-material"
import { Box, Button, IconButton, Link, Paper, TextField, Typography } from "@mui/material"
import { useState } from "react"

export default function SignInComponent() {
    const [errBod, setErrBod] = useState({
        globalErr: false,
        err: false,
        errMsg: ""
    })
    const [dataObj, setDataObj] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: ""
    })
    const [showPass, setShowPass] = useState(false)

    async function validateData() {
        if (dataObj.firstName === "" || dataObj.lastName === "" || dataObj.email === "" || dataObj.password === "" || dataObj.confirmPassword === "") {
            setErrBod({
                globalErr: true,
                err: true,
                errMsg: "All fields are required"
            })
            return false
        } else {
            setErrBod({
                globalErr: false,
                err: false,
                errMsg: ""
            })

        }

        if (dataObj.password !== dataObj.confirmPassword) {
            setErrBod({
                err: true,
                errMsg: "Passwords do not match"
            })
            return false
        }
        if (dataObj.password.length < 8) {
            setErrBod({
                err: true,
                errMsg: "Password must be at least 8 characters"
            })
            return false
        }
        setErrBod({
            err: false,
            errMsg: ""
        })
        return true
    }

    async function handleSubmit() {
        if (await validateData()) {
            console.log(dataObj)
        }

        window.alert("Signup")

    }

    return (

        <Paper sx={{ p: '1em', mt: '1em', borderRadius: '2em', maxWidth: '40em', width: '35em' }}>
            <Typography variant="h4" sx={{ mb: '1em' }} textAlign={"center"}>
                Sign In
            </Typography>

            <TextField
                id="email"
                label="Email"
                variant="outlined"
                fullWidth
                sx={{ mb: '1em' }}
                type="email"
                required
                value={dataObj.email}
                onChange={(e) => setDataObj({ ...dataObj, email: e.target.value })}
            />
            <Box>
                <TextField
                    id="password"
                    label="Password"
                    variant="outlined"
                    fullWidth
                    sx={{ mb: '1em' }}
                    type={showPass ? "text" : "password"}
                    required
                    value={dataObj.password}
                    onChange={(e) => setDataObj({ ...dataObj, password: e.target.value })}
                    error={!errBod.globalErr && errBod.err}
                    helperText={errBod.globalErr ? "" : errBod.errMsg}
                    slotProps={{
                        input: {
                            endAdornment: <IconButton variant="contained" color="primary" onClick={() => setShowPass(!showPass)}>
                                {showPass ? <Visibility /> : <VisibilityOff />}
                            </IconButton>
                        }
                    }}
                />

            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Link onClick={() => window.alert("Switch to Sign in")} variant="caption" sx={{ color: 'Highlight' }}>

                </Link>
            </Box>
            <Box sx={{ display: errBod.globalErr ? 'flex' : 'none', justifyContent: 'center', color: 'red', bgcolor: 'pink', p: '1em', mt: '1em', borderRadius: '1em' }}>
                <Typography>
                    {errBod.errMsg}
                </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: '2em' }}>
                <Button variant="outlined" onClick={() => {
                    window.alert("Cancel")
                    setDataObj({
                        firstName: "",
                        lastName: "",
                        email: "",
                        password: "",
                        confirmPassword: ""
                    })
                    setErrBod({
                        globalErr: false,
                        err: false,
                        errMsg: ""
                    })
                }}>
                    Cancel
                </Button>
                <Button variant="contained" onClick={handleSubmit}>
                    Signup
                </Button>

            </Box>
        </Paper>

    )
}