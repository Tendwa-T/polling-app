"use client"

import { AppBar, Box, IconButton, Toolbar, Typography, Button, Divider, Drawer, Icon, List, ListSubheader, ListItemIcon, ListItemButton, ListItemText } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import Menu from '@mui/icons-material/Menu';
import { useState } from "react";
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SettingsIcon from '@mui/icons-material/Settings';

export default function NavbarComponent({ children }) {


    const drawerWidth = 240;

    const navItems = [
        {
            key: "adminInteraction",
            title: "Interactions",
            icon: <AutoGraphIcon />,
        },
        {
            key: "adminAnalytics",
            title: "Analytics",
            icon: <TrendingUpIcon />,
        },
        {
            key: "adminSettings",
            title: "Settings",
            icon: <SettingsIcon />,
        },
    ]
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    }

    const drawer = (
        <Box onClick={handleDrawerToggle} sx={{ width: drawerWidth, flexShrink: 0 }}>

            <Box sx={{ py: '5em' }} className="bg-gradient-to-br from-blue-400 to-blue-600">
                <Typography variant="h4" textAlign={"center"} >
                    Tildo
                </Typography>
            </Box>

            <Divider flexItem sx={{ mt: '1em' }} />
            <List sx={{ width: '100%' }} component={"nav"} >
                {navItems.map((item) => (
                    <ListItemButton key={item.key}>
                        <ListItemIcon>
                            {item.icon}
                        </ListItemIcon>
                        <ListItemText primary={item.title} />
                    </ListItemButton>
                ))}
            </List>
        </Box>
    )


    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar component="nav">
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <Menu />
                    </IconButton>
                    <Typography
                        variant="h6"
                        component="div"
                        sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }}
                    >
                        Tildo
                    </Typography>
                    <Box>
                        <List sx={{ display: 'flex' }} component={"nav"} >
                            {navItems.map((item) => (
                                <ListItemButton key={item.key}>
                                    <ListItemIcon>
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText primary={item.title} />
                                </ListItemButton>
                            ))}
                        </List>
                    </Box>

                </Toolbar>
            </AppBar>
            <nav>
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true, // Better open performance on mobile.
                    }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                >
                    {drawer}
                </Drawer>
            </nav>
            <Box component="main" sx={{ p: 3 }}>
                <Toolbar />
                {children}
            </Box>
        </Box>
    )
}