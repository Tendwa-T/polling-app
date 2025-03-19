"use client"

import { Box, Button, Paper, Typography } from "@mui/material";
import Image from "next/image";
import * as motion from "motion/react-client"
import { AnimatePresence } from "motion/react"
import SignupComponent from "../components/SignUp";
import SignInComponent from "../components/SignIn";
import { useState } from "react";

export default function AuthenticationComponent() {
    const [showSignup, setShowSignup] = useState(false)
    return (
        <Box sx={{ display: 'flex', }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', width: { md: "40%", xl: "50%" }, height: "100vh", padding: '1em', justifyContent: 'center', alignItems: 'center' }}>
                <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 1 }}>
                    <Typography variant="h4" sx={{ mb: '2em' }}>
                        Welcome to Tildo
                    </Typography>
                </motion.div>

                <motion.div initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 1 }}>
                    <Image src="/illustrations/undraw_happy-announcement_23nf.svg" alt="logo" width={600} height={400} />
                </motion.div>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, padding: '1em', justifyContent: 'center', alignItems: 'center' }} >
                {/*Import Signup and Signin Forms here */}
                <AnimatePresence>
                    {showSignup ?
                        <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 1 }} exit={{ x: -100, opacity: 0 }}>
                            <SignupComponent />
                        </motion.div>
                        :
                        <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 1 }} exit={{ x: -100, opacity: 0 }}>
                            <SignInComponent />
                        </motion.div>
                    }

                </AnimatePresence>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: '3em' }}>
                        <Button variant="text" onClick={() => setShowSignup(!showSignup)}>
                            {showSignup ? "Already have an Account? Sign In" : "Don't have an Account? Sign Up"}
                        </Button>
                    </Box>
                </motion.div>


            </Box>
        </Box >
    );
}