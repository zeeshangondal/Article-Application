import { Link } from "react-router-dom";
import { localStorageUtils } from "../APIs/localStorageUtils";
import { Navbar, Nav } from 'react-bootstrap';

function AppNavbar() {
    const handleLogout = () => {
        const confirmLogout = window.confirm("Are you sure you want to logout?");
        if (confirmLogout) {
            localStorage.removeItem("jwt_token");
            window.location = "/login";
        }
    };

    const loggedInUser = localStorageUtils.getLoggedInUser();

    return (
        <div style={{ fontWeight: 'bold' }}>
            <Navbar bg="light" expand="md">
                <Navbar.Brand as={Link} to="/" className="link-primary fs-5 font-weight-bold text-uppercase">CAPPY</Navbar.Brand>
                <Navbar.Toggle aria-controls="navbar-nav" />
                <Navbar.Collapse id="navbar-nav">
                    <Nav className="mr-auto">
                        <Nav.Link as={Link} to="/" className="link-secondary fs-6">EP Funnel</Nav.Link>
                    </Nav>
                    <Nav>
                        <Nav.Link as={Link} to={`/userProfile/${loggedInUser?._id}`} className="link-secondary fs-6">{loggedInUser && `${loggedInUser.username}`}</Nav.Link>
                        <Nav.Link onClick={handleLogout} className="link-secondary fs-6">Logout</Nav.Link>
                    </Nav>
                </Navbar.Collapse>
            </Navbar>
            <div className='text-center bg-primary' style={{ height: '5px' }}></div>
        </div>
    );
}

export default AppNavbar;
